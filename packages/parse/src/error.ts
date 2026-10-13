import type { Position } from "unist";

/**
 * The error that a parse throws when the source has a part that cannot become
 * a tree. The `position` locates the part in the source when it is known.
 */
export class ParseError extends Error {
  readonly position: Position | undefined;

  constructor(message: string, position?: Position) {
    super(message);
    this.name = "ParseError";
    this.position = position;
  }
}
