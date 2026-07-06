// Curated languages (replaces lowlight's full `common` language set to greatly shrink the bundle)
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import go from "highlight.js/lib/languages/go";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import { createLowlight } from "lowlight";

/**
 * Shared lowlight instance (used by both the editor and front-end server rendering).
 * Kept as a standalone module depending only on highlight.js, so server rendering of
 * the public article page doesn't drag the whole Tiptap / ProseMirror stack into the Worker bundle.
 */
export const lowlight = createLowlight();
lowlight.register({
	bash,
	css,
	diff,
	go,
	html: xml,
	javascript,
	json,
	markdown,
	python,
	rust,
	sql,
	typescript,
	xml,
	yaml,
});
