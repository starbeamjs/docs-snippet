import {
  Highlight,
  HighlightLines,
  HighlightRange,
} from "../annotations/highlight.js";
import { LanguageRegion } from "../annotations/regions.js";
import { Lines, ParsedHighlightLine, type Line } from "./lines.js";

export class ParseRegions {
  static parse(source: string): Record<string, LanguageRegion> {
    const parser = ParseRegions.from(source);
    parser.parse();
    return parser.#regions;
  }

  static from(source: string): ParseRegions {
    const lines = Lines.from(source);
    return new ParseRegions(lines);
  }

  #lines: Lines;
  #regions: Record<string, LanguageRegion> = {};

  private constructor(lines: Lines) {
    this.#lines = lines;
  }

  parse(): void {
    let current = this.#lines.next();

    while (current) {
      const [line, lines] = current;

      switch (line.type) {
        case "region:start": {
          const parseRegion = new ParseRegion(
            lines,
            line.name,
            line.sourceOffset + 1
          );
          const { region, rest } = parseRegion.parse();

          this.#regions[line.name] = region;

          current = rest.next();
          break;
        }

        default: {
          // we're collecting regions here, so we're ignoring top-level lines.
          current = lines.next();
          break;
        }
      }
    }
  }
}

class ParseRegion {
  #lines: Lines;
  #name: string;
  #sourceStart: number;

  #regionSource: string[] = [];
  #highlights: Highlight[] = [];
  #highlightStart: number | null = null;
  #removed = 0;

  constructor(lines: Lines, name: string, sourceStart: number) {
    this.#lines = lines;
    this.#name = name;
    this.#sourceStart = sourceStart;
  }

  parse(): { region: LanguageRegion; rest: Lines } {
    const lines = new LinesIterator(this.#lines);
    // let current = this.#lines.next();
    let line = lines.next();

    loop: while (line) {
      switch (line.type) {
        case "region:start": {
          throw new Error("Nested regions are not supported");
        }

        case "region:end": {
          break loop;
        }

        case "line": {
          this.#regionSource.push(line.content);
          break;
        }

        default: {
          if (line instanceof ParsedHighlightLine) {
            switch (line.type) {
              case "highlight:start": {
                this.#highlightStart = this.#removeMarkerBefore(line);
                break;
              }

              case "highlight:end": {
                if (this.#highlightStart === null) {
                  throw new Error("highlight end without start");
                } else {
                  this.#highlights.push(
                    Highlight.range(
                      this.#highlightStart,
                      this.#removeMarkerAfter(line)
                    )
                  );
                  this.#highlightStart = null;
                }
                break;
              }

              case "highlight:next": {
                if (this.#highlightStart !== null) {
                  throw new Error("highlight next inside of highlight range");
                }

                this.#highlights.push(
                  Highlight.line(this.#removeMarkerBefore(line))
                );

                break;
              }

              case "ignore:next": {
                // the ignore marker and the line that follows it
                this.#removeLine(2);
                line = lines.next();

                break;
              }

              default:
                exhaustive(line);
            }
          } else {
            exhaustive(line);
          }
        }
      }

      line = lines.next();
    }

    return {
      region: new LanguageRegion(
        this.#name,
        this.#regionSource.join("\n"),
        {
          start: this.#sourceStart,
          end: this.#sourceStart + this.#regionSource.length,
        },
        this.#highlights
      ),
      rest: lines.rest(),
    };
  }

  #removeLine(n = 1) {
    this.#removed += n;
  }

  /**
   * Remove a marker that precedes the line we're interested in, and return the target offset of
   * that line.
   */
  #removeMarkerBefore(line: Line) {
    return this.#removeOffset(line);
  }

  /**
   * Remove a marker that follows the line we're interested in, and return the target offset of
   * that line.
   */
  #removeMarkerAfter(line: Line) {
    return this.#removeOffset(line) - 1;
  }

  #removeOffset(line: Line) {
    const offset = line.sourceOffset - this.#sourceStart - this.#removed;
    this.#removed++;
    return offset;
  }
}

class LinesIterator {
  #lines: Lines;

  constructor(lines: Lines) {
    this.#lines = lines;
  }

  consume(): void {
    const next = this.#lines.next();

    if (next === null) {
      return;
    }

    this.#lines = next[1];
  }

  rest(): Lines {
    return this.#lines;
  }

  next(): Line | null {
    const next = this.#lines.next();

    if (next === null) {
      return next;
    }
    this.#lines = next[1];
    return next[0];
  }
}

function exhaustive(value: never): never {
  throw new Error(`unhandled value: ${value}`);
}
