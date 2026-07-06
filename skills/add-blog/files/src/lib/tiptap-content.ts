/**
 * Pure-function utilities for Tiptap / ProseMirror JSON.
 * No dependency on @tiptap/* packages, so it runs safely on either Workers or Node.
 */

type ProseMirrorNode = {
	type?: string;
	text?: string;
	content?: ProseMirrorNode[];
};

/** Block nodes that get newlines added around them (so extracted plain text keeps a sense of paragraphs) */
const BLOCK_TYPES = new Set([
	"paragraph",
	"heading",
	"blockquote",
	"codeBlock",
	"listItem",
	"bulletList",
	"orderedList",
]);

/** Recursively extract plain text from ProseMirror JSON, for search and excerpt fallback */
export function extractPlainText(doc: unknown): string {
	const out: string[] = [];

	const walk = (node: ProseMirrorNode) => {
		if (typeof node.text === "string") out.push(node.text);
		if (Array.isArray(node.content)) {
			for (const child of node.content) walk(child);
		}
		if (node.type && BLOCK_TYPES.has(node.type)) out.push("\n");
	};

	if (doc && typeof doc === "object") walk(doc as ProseMirrorNode);

	return out
		.join("")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/** Estimate reading time (minutes, at least 1); Chinese ~350 chars/min, English words counted too */
export function readingTimeMinutes(plainText: string): number {
	const cjk = (plainText.match(/[一-鿿぀-ヿ]/g) ?? []).length;
	const words = (plainText.match(/[A-Za-z0-9]+/g) ?? []).length;
	const minutes = cjk / 350 + words / 200;
	return Math.max(1, Math.round(minutes));
}
