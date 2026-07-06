// Cloudflare binding types (a minimal hand-written version to avoid wrangler's full runtime types clashing with the DOM).
// Uses inline import types, without pulling in global declarations.
declare global {
	interface CloudflareEnv {
		DB: import("@cloudflare/workers-types").D1Database;
		// [module:r2] MEDIA binding — delete this line when removing the R2 module
		MEDIA: import("@cloudflare/workers-types").R2Bucket;
		ASSETS: import("@cloudflare/workers-types").Fetcher;
		BETTER_AUTH_URL?: string;
		BETTER_AUTH_SECRET?: string;
	}
}

export {};
