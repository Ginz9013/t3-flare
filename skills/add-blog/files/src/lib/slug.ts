/** Convert a string into a URL-friendly slug; non-alphanumerics become hyphens, CJK characters are kept */
export function slugify(input: string): string {
	return input
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9一-鿿]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}
