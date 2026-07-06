/** 將字串轉成網址友善的 slug；非英數轉連字號，保留中日韓字 */
export function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9一-鿿]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}
