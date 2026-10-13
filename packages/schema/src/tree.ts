import type { Contract, Document, Node } from "./types";

/**
 * Calls `fn` for each node of a bound tree, parents before children.
 */
export const visit = <C extends Contract>(
  tree: Document<C> | Node<C>,
  fn: (node: Node<C>) => void,
): void => {
  for (const child of tree.children ?? []) {
    fn(child);
    visit(child, fn);
  }
};

/**
 * Makes a map from node id to node for a bound tree.
 */
export const index = <C extends Contract>(
  tree: Document<C> | Node<C>,
): Map<string, Node<C>> => {
  const map = new Map<string, Node<C>>();
  visit(tree, (node) => {
    map.set(node.data.id, node);
  });
  return map;
};

/**
 * Returns a copy of a bound tree with the node of one id replaced by the result
 * of `fn`. The copy shares the nodes that did not change. Returns the tree
 * itself when no node has the id.
 */
export const replace = <C extends Contract, T extends Document<C> | Node<C>>(
  tree: T,
  id: string,
  fn: (node: Node<C>) => Node<C>,
): T => {
  const children = tree.children;
  if (children === undefined) {
    return tree;
  }
  let changed = false;
  const next = children.map((child) => {
    if (child.data.id === id) {
      changed = true;
      return fn(child);
    }
    const inner = replace(child, id, fn);
    if (inner !== child) {
      changed = true;
    }
    return inner;
  });
  return changed ? { ...tree, children: next } : tree;
};
