import { describe, test, expect } from "vitest";
import { expectSnippet } from "./utils.js";

describe("converting sources into snippets", () => {
  test("a source without any types in it", () => {
    expectSnippet({
      source: `
        const a = 1;
        const b = 2;

        // a normal comment is here
        const c = a + b;

        console.log(c);

        export default c;
      `,
      js: `
        const a = 1;
        const b = 2;

        // a normal comment is here
        const c = a + b;

        console.log(c);

        export default c;
      `,
    });
  });

  test("a source with types in it", () => {
    expectSnippet({
      source: `
        const a: number = 1;
        const b: number = 2;

        // a normal comment is here
        const c = a + b as number;

        console.log(c);

        export default c;

        function hoist<S extends string>(value: S): S {
          return value;
        }
      `,
      js: `
        const a = 1;
        const b = 2;

        // a normal comment is here
        const c = a + b;

        console.log(c);

        export default c;

        function hoist(value) {
          return value;
        }
      `,
    });
  });

  test("a source with class field decorators in it", () => {
    expectSnippet({
      source: `
        class Foo {
          @bar
          bar: number;

          @baz
          baz: number; // a normal comment here
        }
      `,
      js: `
        class Foo {
          @bar
          bar;

          @baz
          baz; // a normal comment here
        }
      `,
    });

    // const source = `
    //   class Foo {
    //     // there's a normal comment here
    //     @field foo: string;
    //   }
    // `;

    // const js = format(`
    //   class Foo {
    //     // there's a normal comment here
    //     @field foo: string;
    //   }
    // `);

    // const ts = format(source);

    // const actual = snippet(source);

    // expect(actual.code).toEqual({
    //   js,
    //   ts,
    // });
  });
});
