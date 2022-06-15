import type { Options as PrettierOptions } from "prettier";
import { format as prettier } from "prettier";

export const PREFERRED_TAGS = {
  NEW_LINE: ["N", "n"],
  SPACES: ["S", "s"],
  SPACES_BEFORE_COLON: ["C", "c"],
  SAME_LINE_ELSE: ["E", "e"],
} as const;

export interface Options {
  debug?: boolean;
  width?: number;
  /**
   * Whether to trim leading and trailing whitespace.
   * @default true
   */
  trim?: boolean;
}

export class UnusedTagsFinder {
  #fileContents: string;
  #options: Options;
  #checkedSimpleTags: Set<string> = new Set();
  #checkedTagsWithCount: Set<string> = new Set();

  constructor(fileContents: string, options: Options) {
    this.#fileContents = fileContents;
    this.#options = options;
  }

  findUnusedTag(
    preferredTags: readonly [upper: string, lower: string],
    isTagWithCount: boolean
  ) {
    const checkedTagsSet = isTagWithCount
      ? this.#checkedTagsWithCount
      : this.#checkedSimpleTags;

    const isTagPresentFunc = isTagWithCount
      ? isTagWithCountPresent
      : isSimpleTagPresent;

    for (const tag of preferredTags) {
      if (!checkedTagsSet.has(tag)) {
        checkedTagsSet.add(tag);

        if (!isTagPresentFunc(this.#fileContents, tag)) {
          return tag;
        } else if (this.#options.debug) {
          console.debug("[docs-ts2js] Tag already present:", tag);
        }
      }
    }

    for (let i = 0; ; i++) {
      const tag = createTagForOrdinal(i);
      if (!checkedTagsSet.has(tag)) {
        checkedTagsSet.add(tag);

        if (!isTagPresentFunc(this.#fileContents, tag)) {
          return tag;
        } else if (this.#options.debug) {
          console.debug("[docs-ts2js] Tag already present:", tag);
        }
      }
    }
  }
}

const TAG_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function createTagForOrdinal(ordinal: number) {
  let tag = "";
  do {
    let tagChar = TAG_CHARS[ordinal % TAG_CHARS.length];
    tag = tagChar + tag;
    ordinal = Math.floor(ordinal / TAG_CHARS.length);
  } while (ordinal > 0);
  return tag;
}

function isSimpleTagPresent(fileContents: string, tag: string) {
  let index = fileContents.search(new RegExp("\\/\\*" + tag + "\\*\\/"));
  return index !== -1;
}

function isTagWithCountPresent(fileContents: string, tag: string) {
  let index = fileContents.search(
    new RegExp("\\/\\*" + tag + "([0-9]+)\\*\\/")
  );
  return index !== -1;
}

export function format(
  source: string,
  options: Options & PrettierOptions = {}
): string {
  const formatted = prettier(source, {
    parser: "typescript",
    printWidth: options?.width ?? options?.printWidth ?? 60,
    trailingComma: "all",
    ...options,
  });

  return (
    formatted
      .trimEnd()
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n") + "\n"
  );
}
