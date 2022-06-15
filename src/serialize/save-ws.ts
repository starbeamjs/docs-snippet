import { Blocks } from "../parse/whitespace.js";
import { PreservedSource } from "./preserved-source.js";
import { PREFERRED_TAGS, UnusedTagsFinder, type Options } from "../utils.js";

export function saveWS(source: string, options: Options): PreservedSource {
  let unusedTagsFinder = new UnusedTagsFinder(source, options);
  const NEW_LINE_TAG = unusedTagsFinder.findUnusedTag(
    PREFERRED_TAGS.NEW_LINE,
    false
  );
  const SPACES_TAG = unusedTagsFinder.findUnusedTag(
    PREFERRED_TAGS.SPACES,
    true
  );
  const SPACES_BEFORE_COLON_TAG = unusedTagsFinder.findUnusedTag(
    PREFERRED_TAGS.SPACES_BEFORE_COLON,
    true
  );
  const SAME_LINE_ELSE_TAG = unusedTagsFinder.findUnusedTag(
    PREFERRED_TAGS.SAME_LINE_ELSE,
    true
  );

  const NEW_LINE_REPLACEMENT = "/*" + NEW_LINE_TAG + "*/$1";

  let blocks = Blocks.parse(source);

  const processed = blocks.process({
    newline: NEW_LINE_REPLACEMENT,
    sameLineElse: SAME_LINE_ELSE_TAG,
    spaces: SPACES_TAG,
    spacesBeforeColon: SPACES_BEFORE_COLON_TAG,
  });
  return new PreservedSource(processed, {
    newline: NEW_LINE_TAG,
    spaces: SPACES_TAG,
    spacesBeforeColon: SPACES_BEFORE_COLON_TAG,
    sameLineElse: SAME_LINE_ELSE_TAG,
  });
}
