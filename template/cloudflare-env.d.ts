// Cloudflare 綁定型別（手寫最小版，避免 wrangler 全 runtime 型別與 DOM 衝突）
// 用 inline import 型別，不引入全域宣告。
declare global {
	interface CloudflareEnv {
		DB: import("@cloudflare/workers-types").D1Database;
		// [module:r2] MEDIA binding — 移除 R2 模組時一併刪除此行
		MEDIA: import("@cloudflare/workers-types").R2Bucket;
		ASSETS: import("@cloudflare/workers-types").Fetcher;
		BETTER_AUTH_URL?: string;
		BETTER_AUTH_SECRET?: string;
	}
}

export {};
