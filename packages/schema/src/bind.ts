import type {
  Bind,
  BindOptions,
  Contract,
  Document,
  Enum,
  Found,
  Issue,
  Kind,
  Node,
  Override,
  Overrides,
  Result,
  Shape,
  Target,
} from "./types";

import { object, within } from "objectively";

import { mergeAttributes, readAttributes } from "./attribute";
import { HTML_TYPE, ROOT_TYPE } from "./constant";
import { identify } from "./identity";
import { kindOf } from "./match";
import { index } from "./tree";
import { nest } from "./util";

/**
 * A node under construction. The bind builds the tree as plain records and
 * narrows the whole tree once, when it has found no issue.
 */
type Raw = Record<string, unknown>;

/**
 * The position of one visit in the tree.
 *
 * - `path` is the route from the root, for the issues.
 * - `parent` is the id of the parent, for the structural ids.
 * - `permitted` is the set of kinds the parent admits.
 * - `counts` is the ordinal of each kind among the siblings.
 * - `shadowed` is `true` under a node whose id is a duplicate. Every
 *   structural id below such a node collides too, and one issue is enough.
 */
type Frame<C extends Contract> = {
  path: string[];
  parent: string;
  permitted: Set<Kind<C>>;
  counts: Map<Kind<C>, number>;
  shadowed: boolean;
};

/**
 * The ledger of one bind.
 *
 * - `issues` collects every failure.
 * - `seen` holds the node ids of the tree.
 * - `found` holds the references to resolve once every id is known.
 */
type State = {
  issues: Issue[];
  seen: Set<string>;
  found: Found[];
};

/**
 * Builds the {@link Bind} for a contract. The bind walks a raw mdast tree,
 * matches each node to a kind, reads its attributes, checks its children,
 * computes its id, and resolves the local references. The bind returns a new
 * tree with the bound fields in `data`, or every issue it found.
 *
 * @param base - The contract.
 * @param enums - The sets of the contract.
 * @param shape - The runtime form of each kind.
 */
export const defineBind = <C extends Contract>(
  base: C,
  enums: Enum<C>,
  shape: Shape<C>,
): Bind<C> => {
  const open = (): State => ({ issues: [], seen: new Set(), found: [] });

  /* Visits one raw node. The function records an issue and returns `undefined`
     when no kind claims the node. It records the other issues and returns the
     built node, so that one pass reports every failure. */
  const visit = (
    raw: unknown,
    frame: Frame<C>,
    state: State,
  ): Raw | undefined => {
    if (!object(raw) || typeof raw.type !== "string") {
      state.issues.push({
        code: "unknown_node",
        message: "Node must be an object with a string type.",
        path: frame.path,
        received: raw,
      });
      return undefined;
    }

    const kind = kindOf(raw, base, enums);
    if (kind === undefined) {
      const html = raw.type === HTML_TYPE;
      state.issues.push({
        code: html ? "raw_html" : "unknown_node",
        message: html
          ? "Raw HTML is not permitted by the contract."
          : `No kind matches node type '${raw.type}'.`,
        path: frame.path,
        received: raw.type,
      });
      return undefined;
    }

    if (!frame.permitted.has(kind)) {
      state.issues.push({
        code: "invalid_child",
        message: `Kind '${kind}' is not permitted here.`,
        path: frame.path,
        expected: [...frame.permitted],
        received: kind,
      });
    }

    const ordinal = frame.counts.get(kind) ?? 0;
    frame.counts.set(kind, ordinal + 1);
    const id = identify(raw, kind, frame.parent, ordinal);
    const duplicate = state.seen.has(id);
    if (!duplicate) {
      state.seen.add(id);
    } else if (!frame.shadowed) {
      state.issues.push({
        code: "duplicate_id",
        message: `Node id '${id}' is used more than once.`,
        path: frame.path,
        received: id,
      });
    }

    const read = readAttributes(raw, kind, shape.kinds[kind], frame.path);
    state.issues.push(...read.issues);
    state.found.push(...read.references);

    const node: Raw = {
      ...raw,
      data: {
        ...(object(raw.data) ? raw.data : {}),
        kind,
        id,
        attributes: read.attributes,
      },
    };
    if (Array.isArray(raw.children)) {
      node.children = walk(
        raw.children,
        shape.kinds[kind].permitted,
        id,
        [...frame.path, "children"],
        frame.shadowed || duplicate,
        state,
      );
    }
    return node;
  };

  /* Walks the children of a node in order under one frame. A kind with no
     content model rejects any child. */
  const walk = (
    list: unknown[],
    permitted: Set<Kind<C>> | undefined,
    parent: string,
    path: string[],
    shadowed: boolean,
    state: State,
  ): Raw[] => {
    if (permitted === undefined) {
      if (list.length > 0) {
        state.issues.push({
          code: "invalid_child",
          message: "The kind permits no children.",
          path,
          received: list.length,
        });
      }
      return [];
    }
    const frame: Frame<C> = {
      path,
      parent,
      permitted,
      counts: new Map(),
      shadowed,
    };
    const out: Raw[] = [];
    for (const [index, raw] of list.entries()) {
      const node = visit(
        raw,
        { ...frame, path: [...path, String(index)] },
        state,
      );
      if (node) {
        out.push(node);
      }
    }
    return out;
  };

  /* A reference to a node of this document must name a known id. A reference
     to another document is kept for the caller to resolve. */
  const settle = (state: State, id: string) => {
    for (const { target, path } of state.found) {
      const local =
        target.node !== undefined &&
        (target.document === undefined || target.document === id);
      if (local && target.node !== undefined && !state.seen.has(target.node)) {
        state.issues.push({
          code: "unknown_reference",
          message: `Reference '#${target.node}' names no node of the document.`,
          path,
          received: target,
        });
      }
    }
  };

  /* The bind is the validation of a tree, as the rules are of the other
     kinds. A tree with no issue is bound, so the predicates narrow the built
     records to their bound types once the issue list is empty. */
  const isDocument = (_root: Raw, state: State): _root is Document<C> =>
    state.issues.length === 0;
  const isNode = (_node: Raw, state: State): _node is Node<C> =>
    state.issues.length === 0;

  const document = (v: unknown, options?: BindOptions): Result<Document<C>> => {
    if (!object(v) || v.type !== ROOT_TYPE || !Array.isArray(v.children)) {
      return {
        success: false,
        issues: [
          {
            code: "type_mismatch",
            message: "Document must be a root node with children.",
            received: v,
          },
        ],
      };
    }
    const state = open();
    const given =
      object(v.data) && typeof v.data.id === "string" ? v.data.id : "";
    const id = options?.id ?? given;
    const children = walk(
      v.children,
      shape.root,
      "",
      ["children"],
      false,
      state,
    );
    settle(state, id);
    const references: Target[] = state.found.map(({ target }) => target);
    const root: Raw = {
      ...v,
      type: ROOT_TYPE,
      data: { ...(object(v.data) ? v.data : {}), id, references },
      children,
    };
    if (!isDocument(root, state)) {
      return { success: false, issues: state.issues };
    }
    return { success: true, data: root };
  };

  const node = (v: unknown): Result<Node<C>> => {
    const state = open();
    const frame: Frame<C> = {
      path: [],
      parent: "",
      permitted: enums.kinds,
      counts: new Map(),
      shadowed: false,
    };
    const built = visit(v, frame, state);
    settle(state, "");
    if (built === undefined || !isNode(built, state)) {
      return { success: false, issues: state.issues };
    }
    return { success: true, data: built };
  };

  /* Applies an override to a bound node. The attributes merge over the bound
     attributes under the rules of the kind. The children bind under the
     content model and the id of the node, so their structural ids are the
     ids the node would give them. The node ids of the subtree are new, so
     the function does not check them against the rest of the document. */
  const override = (target: Node<C>, override: Override): Result<Node<C>> => {
    const state = open();
    const kind = target.data.kind;
    const built: Raw = { ...target };
    if (override.attributes !== undefined) {
      const merged = mergeAttributes(
        target.data.attributes,
        override.attributes,
        kind,
        shape.kinds[kind],
        ["attributes"],
      );
      state.issues.push(...merged.issues);
      state.found.push(...merged.references);
      built.data = { ...target.data, attributes: merged.attributes };
    }
    if (override.children !== undefined) {
      built.children = walk(
        override.children,
        shape.kinds[kind].permitted,
        target.data.id,
        ["children"],
        false,
        state,
      );
    }
    if (!isNode(built, state)) {
      return { success: false, issues: state.issues };
    }
    return { success: true, data: built };
  };

  /* The overrides passed, so the map is a map of overrides. */
  const isOverrides = (_v: Raw, issues: Issue[]): _v is Overrides =>
    issues.length === 0;

  /* Checks a map of overrides by node id against a bound document. Each id
     must name a node of the document. Each override must have the shape of an
     override and apply to its node. */
  const overrides = (
    target: Document<C>,
    v: unknown,
    path: string[] = [],
  ): Result<Overrides> => {
    if (!object(v)) {
      return {
        success: false,
        issues: [
          {
            code: "not_object",
            message: "Overrides must be an object.",
            path,
            received: v,
          },
        ],
      };
    }
    const issues: Issue[] = [];
    const nodes = index(target);
    for (const [id, candidate] of Object.entries(v)) {
      const at = [...path, id];
      const node = nodes.get(id);
      if (node === undefined) {
        issues.push({
          code: "unknown_reference",
          message: `Node id '${id}' names no node of the document.`,
          path: at,
          received: id,
        });
        continue;
      }
      if (!object(candidate)) {
        issues.push({
          code: "not_object",
          message: "Override must be an object.",
          path: at,
          received: candidate,
        });
        continue;
      }
      const stray = Object.keys(candidate).find(
        (key) => !within(enums.overrideKeys, key),
      );
      if (stray !== undefined) {
        issues.push({
          code: "unknown_key",
          message: `Override contains an unknown key '${stray}'.`,
          path: [...at, stray],
          expected: [...enums.overrideKeys],
          received: stray,
        });
        continue;
      }
      const attributes = candidate.attributes;
      const children = candidate.children;
      if (attributes !== undefined && !object(attributes)) {
        issues.push({
          code: "not_object",
          message: "Attributes must be an object.",
          path: [...at, "attributes"],
          received: attributes,
        });
        continue;
      }
      if (children !== undefined && !Array.isArray(children)) {
        issues.push({
          code: "not_array",
          message: "Children must be an array.",
          path: [...at, "children"],
          received: children,
        });
        continue;
      }
      const applied = override(node, {
        ...(attributes === undefined ? {} : { attributes }),
        ...(children === undefined ? {} : { children }),
      });
      if (!applied.success) {
        issues.push(...applied.issues.map((issue) => nest(id, issue)));
      }
    }
    if (!isOverrides(v, issues)) {
      return { success: false, issues };
    }
    return { success: true, data: v };
  };

  return {
    document,
    node,
    override,
    overrides: (target, v) => overrides(target, v),
  };
};
