import { type Tags } from "../serialize/preserved-source.js";

const stringOrCommentEnd = {
  "'": /(?<!(?:^|[^\\])(?:\\\\)*\\)'/, // ignore quotes preceded by odd number of slashes
  '"': /(?<!(?:^|[^\\])(?:\\\\)*\\)"/,
  "`": /(?<!(?:^|[^\\])(?:\\\\)*\\)`/,
  "//": /(?=\r?\n)/,
  "/*": /\*\//,
} as const;

export class Blocks {
  static parse(source: string) {
    const blocks = new Blocks();
    parseStringAndComments(source, blocks);
    blocks.finalize();
    return blocks;
  }

  #current: Block | undefined;
  #blocks: Block[] = [];

  append(code: string, comment: string) {
    if (code.length === 0 && this.#current !== undefined) {
      this.#current.appendComment(comment);
    } else {
      if (this.#current) {
        this.#blocks.push(this.#current);
      }

      this.#current = new Block(code, comment);
    }
  }

  finalize() {
    if (this.#current) {
      this.#blocks.push(this.#current);
      this.#current = undefined;
    }
  }

  process(tags: Tags): string {
    let first = true;

    for (const block of this.#blocks) {
      block.processSameLineElse(tags.sameLineElse);
      block.processSpacesBeforeColon(tags.spacesBeforeColon, first);
      block.processSpaces(tags.spaces, first);
      block.processNewline(tags.newline, first);

      first = false;
    }

    return this.#blocks.map((block) => block.toString()).join("");
  }
}

export class Block {
  #code: string;
  #stringOrComment: string | undefined;

  constructor(code: string, stringOrComment?: string | undefined) {
    this.#code = code;
    this.#stringOrComment = stringOrComment;
  }

  appendComment(comment: string) {
    this.#stringOrComment += comment;
  }

  processSameLineElse(tag: string) {
    this.#code = this.#code.replace(
      /\}( *)else/g,
      function replacer(match, group1) {
        return `} /*${tag}${group1.length}*/else`;
      }
    );
  }

  processSpacesBeforeColon(tag: string, isFirst: boolean) {
    let regex = isFirst ? /(?<=[^ \n])( +):/g : /(?<=^|[^ \n])( +):/g;

    this.#code = this.#code.replace(regex, function replacer(match, group1) {
      return ` /*${tag}${group1.length}*/:`;
    });
  }

  processSpaces(tag: string, isFirst: boolean) {
    let regex = isFirst
      ? /(?<=[^ \n])(  +)(?![ :])/g
      : /(?<=^|[^ \n])(  +)(?![ :])/g;

    this.#code = this.#code.replace(regex, function replacer(match, group1) {
      return ` /*${tag}${group1.length}*/ `;
    });
  }

  processNewline(tag: string, isFirst: boolean) {
    let regex = isFirst
      ? /(?<=(?:^|\n)[ \t]*)(\r?\n)/g // empty line possibly at file start
      : /(?<=\n[ \t]*)(\r?\n)/g; // empty line

    this.#code = this.#code.replace(regex, tag);
  }

  toString(): string {
    if (this.#stringOrComment) {
      return `${this.#code}${this.#stringOrComment}`;
    } else {
      return this.#code;
    }
  }
}

function parseStringAndComments(code: string, blocks: Blocks): void {
  let codeToParse = code;

  while (codeToParse.length > 0) {
    let codeBlock;
    let commentBlock;

    let commentStartMatch = codeToParse.match(/['"`]|\/\/|\/\*/);
    if (commentStartMatch?.index === undefined) {
      codeBlock = codeToParse;
      commentBlock = "";
      codeToParse = "";
    } else {
      let commentStartIndex = commentStartMatch.index;
      codeBlock = codeToParse.slice(0, commentStartIndex);

      let commentStartChars = commentStartMatch[0];
      let commentContentsIndex = commentStartIndex + commentStartChars.length;
      let commentEndRegex =
        stringOrCommentEnd[
          commentStartChars as keyof typeof stringOrCommentEnd
        ];
      let commentEndMatch = codeToParse
        .slice(commentContentsIndex)
        .match(commentEndRegex);
      if (commentEndMatch?.index === undefined) {
        commentBlock = codeToParse.slice(commentStartIndex);
        codeToParse = "";
      } else {
        let commentEndIndexRelative = commentEndMatch.index;
        let commentEndChars = commentEndMatch[0];
        let nextCodeStartIndex =
          commentContentsIndex +
          commentEndIndexRelative +
          commentEndChars.length;
        commentBlock = codeToParse.slice(commentStartIndex, nextCodeStartIndex);
        codeToParse = codeToParse.slice(nextCodeStartIndex);
      }
    }

    blocks.append(codeBlock, commentBlock);
  }
}
