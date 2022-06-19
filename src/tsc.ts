import { createConfigItem, transform } from "@babel/core";
import * as babel from "@babel/core";

// @ts-expect-error We're only importing so we can create a config item, so we don't care about types
import bts from "@babel/plugin-transform-typescript";
const babelTsTransform = createConfigItem([bts, { isTSX: true }]);

// @ts-expect-error We're only importing so we can create a config item, so we don't care about types
import bsd from "@babel/plugin-syntax-decorators";
const babelDecoratorSyntax = createConfigItem([bsd, { legacy: true }]);

export function tsc(source: string): string {
  const result = transform(source, {
    plugins: [babelTsTransform, babelDecoratorSyntax],
    generatorOpts: { retainLines: true, shouldPrintComment: () => true },
  });

  if (result === null || result === undefined) {
    throw Error(`Could not parse source: ${source}`);
  }

  return result.code ?? "";
}
