export interface Tags {
  newline: string;
  spaces: string;
  spacesBeforeColon: string;
  sameLineElse: string;
}

const METADATA_TAG = "PRESERVE_TYPESCRIPT_WHITESPACE_METADATA";

export class PreservedSource {
  #source: string;
  #tags: Tags;

  constructor(source: string, tags: Tags) {
    this.#source = source;
    this.#tags = tags;
  }

  transform(transformer: (source: string) => string): PreservedSource {
    const transformed = transformer(this.#source);
    return new PreservedSource(transformed, this.#tags);
  }

  restore(): string {
    let contents = this.#source;
    const tags = this.#tags;

    contents = contents.replace(
      new RegExp(`\\/\\*${tags.newline}\\*\\/`, "g"),
      ""
    );

    contents = contents.replace(
      new RegExp(` ?\\/\\*${tags.spacesBeforeColon}([0-9]+)\\*\\/:`, "g"),
      function replacer(match, group1) {
        let spacesCount = Number(group1);
        return " ".repeat(spacesCount) + ":";
      }
    );

    contents = contents.replace(
      new RegExp(
        ` ?\\/\\*${tags.spacesBeforeColon}([0-9]+)\\*\\/(?=[,;\\)\\} \\t\\r\\n])`,
        "g"
      ),
      ""
    ); // can safely collapse
    contents = contents.replace(
      new RegExp(` ?\\/\\*${tags.spacesBeforeColon}([0-9]+)\\*\\/`, "g"),
      " "
    ); // cannot fully collapse, leave one space

    contents = contents.replace(
      new RegExp("\\/\\*" + tags.spaces + "([0-9]+)\\*\\/", "g"),
      function replacer(match, group1) {
        let spacesCount = Number(group1);
        return " ".repeat(spacesCount - 2);
      }
    );

    contents = contents.replace(
      new RegExp(
        "\\} \\/\\*" + tags.sameLineElse + "([0-9]+)\\*\\/\\r?\\n[ \\t]*else",
        "g"
      ),
      function replacer(match, group1) {
        let spacesCount = Number(group1);
        return "}" + " ".repeat(spacesCount) + "else";
      }
    );

    return contents;
  }
}
