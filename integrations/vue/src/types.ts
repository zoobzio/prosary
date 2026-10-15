import type { Component } from "vue";

/**
 * What renders in place of an element: by tag name (`h2`, `a`) or, for an
 * element built from a directive, by the directive's name (`callout`). A
 * directive's name wins over its tag. The component receives the element's
 * attributes as props — a directive's own attributes by the names they were
 * written with — and its children in the default slot.
 */
export type Components = Record<string, Component>;
