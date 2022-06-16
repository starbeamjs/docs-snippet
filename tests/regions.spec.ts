import Snippet, { format, type Region, type Regions } from "docs-snippet";
import { describe, expect, test } from "vitest";

describe("extracting regions from a snippet", () => {
  test("a source without regions", () => {
    const snippet = Snippet(`
      const a = 1;
      const b = 2;

      // a normal comment is here
      const c = a + b;

      console.log(c);
    `);

    expect(snippet.ts.regions).toBe(null);
  });

  test("a source with regions", () => {
    const snippet = Snippet(`
      const a = 1;
      const b = 2;

      // #region a
      // a normal comment is here
      const c = a + b;

      console.log(c);
      // #endregion
    `);

    const regions = codeRegions(snippet.regions);

    expect(regions?.a.ts).toBe(
      format(`
        // a normal comment is here
        const c = a + b;

        console.log(c);
      `)
    );

    expect(regions?.a.js).toBe(
      format(`
        // a normal comment is here
        const c = a + b;

        console.log(c);
      `)
    );
  });

  test("multiple regions", () => {
    const snippet = Snippet(`
      const a = 1;
      const b = 2;

      // #region a
      // a normal comment is here
      const c = a + b;

      console.log(c);
      // #endregion

      // #region b
      /* a normal block comment is here */
      const d = a + b;

      console.log(d);
      // #endregion
    `);

    const snippetRegions = snippet.regions;

    expect(snippetRegions?.get("a")).toSatisfy(
      (region: Region) => region.isSame
    );

    expect(snippetRegions?.get("b")).toSatisfy(
      (region: Region) => region.isSame
    );

    const regions = codeRegions(snippet.regions);

    expect(regions?.a.ts).toBe(
      format(`
        // a normal comment is here
        const c = a + b;

        console.log(c);
      `)
    );

    expect(regions?.a.js).toBe(
      format(`
        // a normal comment is here
        const c = a + b;

        console.log(c);
      `)
    );

    expect(regions?.b.ts).toBe(
      format(`
        /* a normal block comment is here */
        const d = a + b;

        console.log(d);
      `)
    );

    expect(regions?.b.js).toBe(
      format(`
        /* a normal block comment is here */
        const d = a + b;

        console.log(d);
      `)
    );
  });

  test("a region with a #highlight:next highlight", () => {
    const snippet = Snippet(`
      const a = 1;

      // #region a
      // a normal comment is here

      // #highlight:next
      const c = a + b;

      console.log(c);
      // #endregion
    `);

    const snippetRegions = snippet.regions;

    const aRegion = snippetRegions?.get("a");

    if (aRegion === undefined) {
      expect(aRegion).not.toBe(null);
      return;
    }

    // assert that the `a` region has a highlight
    const highlights = aRegion.js.highlights;

    expect(highlights?.map((h) => h.source(aRegion.js.code))).toEqual([
      ["const c = a + b;"],
    ]);

    expect(snippetRegions?.get("a")).toSatisfy(
      (region: Region) => region.js.highlights.length === 1
    );
  });

  test("a region with a range highlight", () => {
    const snippet = Snippet(`
      const a = 1;

      // #region a
      // a normal comment is here

      // #highlight:start
      const c = a + b;

      console.log(c);
      // #highlight:end
      // #endregion
    `);

    const snippetRegions = snippet.regions;

    const aRegion = snippetRegions?.get("a");

    if (aRegion === undefined) {
      expect(aRegion).not.toBe(null);
      return;
    }

    // assert that the `a` region has a highlight
    const highlights = aRegion.js.highlights;

    expect(highlights?.map((h) => h.lines)).toEqual(["3-5"]);

    expect(highlights?.map((h) => h.source(aRegion.js.code))).toEqual([
      ["const c = a + b;", "", "console.log(c);"],
    ]);

    expect(snippetRegions?.get("a")).toSatisfy(
      (region: Region) => region.js.highlights.length === 1
    );
  });

  test("a region with multiple highlights", () => {
    const snippet = Snippet(`
      const a = 1;

      // #region a
      // a normal comment is here

      // #highlight:start
      const c = a + b;

      console.log(c);
      // #highlight:end

      // #highlight:next
      const d = a + c;

      console.log(d);

      // #highlight:start
      const e = a + d;

      console.log(e);
      // #highlight:end
      // #endregion
    `);

    const snippetRegions = snippet.regions;

    const aRegion = snippetRegions?.get("a");

    if (aRegion === undefined) {
      expect(aRegion).not.toBe(null);
      return;
    }

    // assert that the `a` region has a highlight
    const highlights = aRegion.js.highlights;

    expect(highlights?.map((h) => h.lines)).toEqual(["3-5", "7", "11-13"]);

    expect(highlights?.map((h) => h.source(aRegion.js.code))).toEqual([
      ["const c = a + b;", "", "console.log(c);"],
      ["const d = a + c;"],
      ["const e = a + d;", "", "console.log(e);"],
    ]);
  });

  test("a region with ignore:next", () => {
    const snippet = Snippet(`
      const a = 1;
      const b = 2;

      // #region a
      import type { Reactive } from "reactive";

      // #ignore:next
      {
        // #highlight:next
        const c: Reactive = a + b;
        // #endregion
      }
    `);

    const snippetRegions = snippet.regions;

    const aRegion = snippetRegions?.get("a");

    if (aRegion === undefined) {
      expect(aRegion).not.toBe(null);
      return;
    }

    expect(aRegion.js.code).toBe("const c = a + b;\n");

    // the a region should not include ignored lines, and highlight lines shouldn't include ignored lines.
    expect(aRegion.js.highlights.map((h) => h.lines)).toEqual(["1"]);

    expect(aRegion.ts.code).toBe(
      `import type { Reactive } from "reactive";\n` +
        `\n` +
        `const c: Reactive = a + b;\n`
    );

    expect(aRegion.ts.highlights.map((h) => h.lines)).toEqual(["3"]);
  });
});

function codeRegions(regions: Regions | null): {
  [name: string]: { ts: string; js: string };
} | null {
  if (regions === null) {
    expect(regions).not.toBe(null);
    return null;
  }

  return Object.fromEntries(
    [...regions].map((region) => [
      region.name,
      { ts: region.ts.code, js: region.js.code },
    ])
  );
}
