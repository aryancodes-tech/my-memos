import { common, createLowlight } from "lowlight";

/** Shared lowlight grammar registry for editor code-block highlighting. */
export const codeLowlight = createLowlight(common);

/** Default language applied when inserting a new code block from the slash menu. */
export const DEFAULT_CODE_LANGUAGE = "typescript";
