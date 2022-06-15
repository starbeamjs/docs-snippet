export abstract class ParsedLine {
  static parse(line: string, offset: number): Line {
    if (line.startsWith("// #region ")) {
      return new ParsedRegionStartLine(
        offset,
        line.substring("// #region ".length)
      );
    } else if (line.startsWith("// #endregion")) {
      return new ParsedRegionEndLine(offset);
    } else if (line.startsWith("// #highlight:next")) {
      return new ParsedHighlightLine("highlight:next", offset);
    } else if (line.startsWith("// #highlight:start")) {
      return new ParsedHighlightLine("highlight:start", offset);
    } else if (line.startsWith("// #highlight:end")) {
      return new ParsedHighlightLine("highlight:end", offset);
    } else {
      return new ParsedContentLine(offset, line);
    }
  }

  #offset: number;
  readonly adjust: number = 1;

  abstract readonly type: LineType;

  constructor(offset: number) {
    this.#offset = offset;
  }

  get sourceOffset(): number {
    return this.#offset;
  }
}

type ParsedHighlightType =
  | "highlight:start"
  | "highlight:end"
  | "highlight:next";

class ParsedRegionEndLine extends ParsedLine {
  readonly type = "region:end";
}

export class ParsedHighlightLine extends ParsedLine {
  readonly type: ParsedHighlightType;

  constructor(type: ParsedHighlightType, offset: number) {
    super(offset);
    this.type = type;
  }
}

class ParsedContentLine extends ParsedLine {
  static is(line: ParsedLine): line is ParsedContentLine {
    return line.type === "line";
  }

  readonly type = "line";

  readonly adjust = 0;

  constructor(offset: number, readonly content: string) {
    super(offset);
  }
}

class ParsedRegionStartLine extends ParsedLine {
  static is(line: ParsedLine): line is ParsedRegionStartLine {
    return line.type === "region:start";
  }

  readonly type = "region:start";
  #name: string;

  constructor(offset: number, name: string) {
    super(offset);
    this.#name = name;
  }

  get name(): string {
    return this.#name;
  }
}

export type LineType =
  | "line"
  | "region:start"
  | "region:end"
  | "highlight:start"
  | "highlight:end"
  | "highlight:next";

export type Line =
  | ParsedContentLine
  | ParsedRegionStartLine
  | ParsedRegionEndLine
  | ParsedHighlightLine
  | ParsedRegionStartLine;

export class Lines {
  static from(source: string): Lines {
    return new Lines(source.split("\n"), 0);
  }

  static empty() {
    return new Lines([], 0);
  }

  #lines: string[];
  #offset: number;

  constructor(lines: string[], offset: number) {
    this.#lines = lines;
    this.#offset = offset;
  }

  [Symbol.for("nodejs.util.inspect.custom")](): string {
    return `Lines(${this.#lines.length})`;
  }

  next(): readonly [Line, Lines] | null {
    const [line, ...lines] = this.#lines;

    if (line !== undefined) {
      return [
        ParsedLine.parse(line, this.#offset),
        new Lines(lines, this.#offset + 1),
      ];
    } else {
      return null;
    }
  }
}
