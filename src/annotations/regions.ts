import { Source } from "../source.js";
import { Highlight } from "./highlight.js";

export class Regions {
  static create(regions: Record<string, Region>): Regions {
    return new Regions(regions);
  }

  #regions: Record<string, Region>;

  private constructor(regions: Record<string, Region>) {
    this.#regions = regions;
  }

  [Symbol.iterator]() {
    return Object.values(this.#regions)[Symbol.iterator]();
  }

  get(name: string): Region | undefined {
    return this.#regions[name];
  }

  *names() {
    for (const [name] of Object.entries(this.#regions)) {
      yield name;
    }
  }

  *entries() {
    for (const [name, region] of Object.entries(this.#regions)) {
      yield [name, region];
    }
  }
}

export class Region {
  static create(name: string, ts: LanguageRegion, js: LanguageRegion): Region {
    return new Region(name, ts, js);
  }

  #name: string;
  #ts: LanguageRegion;
  #js: LanguageRegion;

  private constructor(name: string, ts: LanguageRegion, js: LanguageRegion) {
    this.#name = name;
    this.#ts = ts;
    this.#js = js;
  }

  get name() {
    return this.#name;
  }

  get isSame() {
    return this.#ts.isSame(this.#js);
  }

  get code(): { ts: string; js: string } {
    return {
      ts: this.#ts.code,
      js: this.#js.code,
    };
  }

  get js(): LanguageRegion {
    return this.#js;
  }

  get ts(): LanguageRegion {
    return this.#ts;
  }
}

export class LanguageRegion {
  #name: string;
  #code: string;
  #offsets: { start: number; end: number };
  #highlights: Highlight[];

  constructor(
    name: string,
    code: string,
    offsets: { start: number; end: number },
    highlights: Highlight[]
  ) {
    this.#name = name;
    this.#code = code;
    this.#offsets = offsets;
    this.#highlights = highlights;
  }

  isSame(other: LanguageRegion) {
    return this.#code === other.#code;
  }

  get highlights(): Highlight[] {
    return this.#highlights;
  }

  get name() {
    return this.#name;
  }

  /**
   * Line offsets into the original source.
   */
  get offsets() {
    return this.#offsets;
  }

  get code() {
    return this.#code.trimEnd() + "\n";
  }
}
