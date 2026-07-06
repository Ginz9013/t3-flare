/**
 * Tiptap / ProseMirror JSON 的純函式工具。
 * 不依賴 @tiptap/* 套件，可在 Workers / Node 任一端安全執行。
 */

type ProseMirrorNode = {
	type?: string;
	text?: string;
	content?: ProseMirrorNode[];
};

/** 會在前後補換行的區塊節點（讓抽出的純文字保有段落感） */
const BLOCK_TYPES = new Set([
	"paragraph",
	"heading",
	"blockquote",
	"codeBlock",
	"listItem",
	"bulletList",
	"orderedList",
]);

/** 從 ProseMirror JSON 遞迴抽出純文字，供搜尋與摘要 fallback 使用 */
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

/** 估算閱讀時間（分鐘，至少 1）；中文約 350 字/分，英文 word 一併計入 */
export function readingTimeMinutes(plainText: string): number {
	const cjk = (plainText.match(/[一-鿿぀-ヿ]/g) ?? []).length;
	const words = (plainText.match(/[A-Za-z0-9]+/g) ?? []).length;
	const minutes = cjk / 350 + words / 200;
	return Math.max(1, Math.round(minutes));
}
