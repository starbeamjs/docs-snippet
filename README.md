[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](code_of_conduct.md)

The `docs-snippet` library is a way to convert a snippet of TypeScript code into the equivalent JavaScript code, with whitespace and comments preserved as much as possible. It also uses `prettier` to format both the JavaScript and TypeScript code to attempt to normalize them as much as possible while still preserving whitespace.

It also provides a way to specify [regions] and highlights inline in the code.

```ts
import Snippet from "docs-snippet";

const snippet = Snippet(`
  // #region first
  // This is a comment
  const x: number = 1;
  // #endregion

  // #region second
  /* This is a block comment */
  // #highlight:next
  const y = 2; // an inline comment

  // #highlight:start
  const z = 3;
  const a: number = x + y + z;
  // #highlight:end

  console.log(a);
  // #endregion
`);

const regionA = snippet.regions.a;

expect(regionA.ts.code).toBe("// This is a comment\nconst x: number = 1;\n");
expect(regionA.js.code).toBe("// This is a comment\nconst x = 1;\n");

const regionB = snippet.regions.b;

expect(regionB.ts.code).toBe(
  "/* This is a block comment */\n" +
    "const y = 2; // an inline comment\n" +
    "\n" +
    "const z = 3;\n" +
    "const a: number = x + y + z;\n" +
    "\n" +
    "console.log(a);\n"
);

expect(regionB.ts.highlights.map((h) => h.lines)).toEqual(["2", "4-5"]);

expect(regionB.js.code).toBe(
  "/* This is a block comment */\n" +
    "const y = 2; // an inline comment\n" +
    "\n" +
    "const z = 3;\n" +
    "const a = x + y + z;\n" +
    "\n" +
    "console.log(a);\n"
);

expect(regionB.js.highlights.map((h) => h.lines)).toEqual(["2", "4-5"]);
```

[regions]: https://code.visualstudio.com/docs/editor/codebasics#_folding
