export interface Highlight {
  /**
   * Comma-separated lines or a dash-separated range of lines.
   */
  lines: string;

  /**
   * The highlighted lines as source strings
   */
  source(region: string): string[];
}

export const Highlight = {
  line: (line: number): Highlight => new HighlightLines([line]),
  lines: (lines: number[]): Highlight => new HighlightLines(lines),
  range: (start: number, end: number): Highlight =>
    new HighlightRange(start, end),
} as const;

export class HighlightLines implements Highlight {
  #lines: number[];

  constructor(lines: number[]) {
    this.#lines = lines;
  }

  get lines(): string {
    return this.#lines.map((l) => l + 1).join(",");
  }

  /**
   * Return the highlighted lines as source strings.
   */
  source(region: string): string[] {
    const source = region.split("\n");
    return this.#lines.map((line) => source[line]);
  }

  [Symbol.for("nodejs.util.inspect.custom")](): string {
    return `HighlightLines(${this.lines})`;
  }
}

export class HighlightRange implements Highlight {
  #start: number;
  #end: number;

  constructor(start: number, end: number) {
    this.#start = start;
    this.#end = end;
  }

  /**
   * Return the highlighted lines as source strings.
   */
  source(region: string): string[] {
    return region.split("\n").slice(this.#start, this.#end + 1);
  }

  get lines(): string {
    return `${this.#start + 1}-${this.#end + 1}`;
  }

  [Symbol.for("nodejs.util.inspect.custom")](): string {
    return `HighlightRange(${this.lines})`;
  }
}
