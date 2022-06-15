import type { Options as SwcOptions } from "@swc/core";
import type { Options as PrettierOptions } from "prettier";
import { Region, Regions } from "./annotations/regions.js";
import { saveWS } from "./serialize/save-ws.js";
import { Source } from "./source.js";
import { tsc } from "./tsc.js";
import { format, type Options } from "./utils.js";

export class Snippets {
  static create(ts: string, js: string): Snippets {
    return new Snippets(new Source(ts), new Source(js));
  }

  #ts: Source;
  #js: Source;

  private constructor(ts: Source, js: Source) {
    this.#ts = ts;
    this.#js = js;
  }

  get ts(): Source {
    return this.#ts;
  }

  get js(): Source {
    return this.#js;
  }

  get code(): { ts: string; js: string } {
    return {
      ts: this.ts.code,
      js: this.js.code,
    };
  }

  get regions(): Regions | null {
    const regions: Record<string, Region> = {};

    const ts = this.ts;
    const js = this.js;

    const tsRegions = ts.regions;
    const jsRegions = js.regions;

    if (tsRegions === null || jsRegions === null) {
      return null;
    }

    for (const [name, tsRegion] of Object.entries(tsRegions)) {
      if (!(name in jsRegions)) {
        throw Error(
          `Region ${name} was present in the source TS, but not found in the output JS`
        );
      }

      regions[name] = Region.create(name, tsRegion, jsRegions[name]);
    }

    return Regions.create(regions);
  }
}

export function Snippet(
  source: string,
  options: Options & { prettier?: PrettierOptions; swc?: SwcOptions } = {}
): Snippets {
  const input = options?.trim === false ? source : source.trim();

  const saved = saveWS(input, options);

  const js = saved.transform(tsc);
  const ts = saved;

  return Snippets.create(
    format(ts.restore(), options),
    format(js.restore(), options)
  );
}
