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
  try {
    const input = options?.trim === false ? source : source.trim();

    const saved = saveWS(input, options);

    const js = saved.transform(tsc);
    const ts = saved;

    return Snippets.create(
      format(ts.restore(), options),
      format(js.restore(), options)
    );
  } catch (e) {
    if (isError(e)) {
      e.message = stripAnsi(e.message);
      e.stack = stripAnsi(e.stack);
    }
    throw e;
  }
}

function isError(e: unknown): e is { message: string; stack: string } {
  return typeof e === "object" && e !== null && "message" in e && "stack" in e;
}

// from https://github.com/chalk/ansi-regex/blob/main/index.js
const ANSI = ({ onlyFirst = false }: { onlyFirst?: boolean } = {}) => {
  const pattern = [
    "[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)",
    "(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))",
  ].join("|");

  return new RegExp(pattern, onlyFirst ? undefined : "g");
};

function stripAnsi(string: string) {
  if (typeof string !== "string") {
    throw new TypeError(`Expected a \`string\`, got \`${typeof string}\``);
  }

  return string.replace(ANSI(), "");
}
