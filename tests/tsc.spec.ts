import Snippet, { format, type Region } from "docs-snippet";
import { describe, expect, test } from "vitest";
import { codeRegions } from "./regions.spec.js";

describe("supports TSX syntax", () => {
  test("a source without regions", () => {
    const snippet = Snippet(`
      // #region jsx
      const a = <span>1</span>;
      const b = <span>2</span>;
      const c = <span>3</span>;

      // a normal comment is here
      const d = <>{a} + {b} = {c}</>;
      // #endregion

      console.log(c);
    `);

    const snippetRegions = snippet.regions;

    expect(snippetRegions?.get("jsx")).toSatisfy(
      (region: Region) => region?.isSame
    );

    const regions = codeRegions(snippet.regions);

    expect(regions?.jsx?.ts).toBe(
      format(`
        const a = <span>1</span>;
        const b = <span>2</span>;
        const c = <span>3</span>;

        // a normal comment is here
        const d = <>{a} + {b} = {c}</>;
      `)
    );
  });
});
