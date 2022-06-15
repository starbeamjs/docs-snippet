import { ParseRegions } from "./parse/region.js";
import { LanguageRegion } from "./annotations/regions.js";

export class Source {
  #source: string;

  constructor(source: string) {
    this.#source = source;
  }

  get code(): string {
    return this.#source;
  }

  /**
   * A region is an area of code that begins with `// #region name` and ends with `// #endregion`.
   */
  get regions(): Record<string, LanguageRegion> | null {
    const regions = ParseRegions.parse(this.#source);

    if (Object.keys(regions).length === 0) {
      return null;
    }

    return regions;
  }
}
