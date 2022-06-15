import snippet, { format } from "docs-snippet";
import { expect } from "vitest";

export function expectSnippet({ source, js }: { source: string; js: string }) {
  const actual = snippet(source);

  expect(actual.code.js).toBe(format(js));
  expect(actual.code.ts).toBe(format(source));
}
