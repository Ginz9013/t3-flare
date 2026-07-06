// 精選語言（取代 lowlight `common` 的全量語言集，大幅縮小 bundle）
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
 * 共用的 lowlight 實例（編輯器與前台 server 渲染共用）。
 * 獨立成一個僅依賴 highlight.js 的模組，讓前台文章頁的 server 渲染
 * 不會連帶把整套 Tiptap / ProseMirror 拖進 Worker bundle。
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
