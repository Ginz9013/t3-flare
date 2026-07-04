import { PrismaClient } from "@prisma/client";

export type DB = PrismaClient;

// 是否在 Cloudflare Workers runtime（wrangler dev / 正式環境）
const isWorkers =
	typeof navigator !== "undefined" &&
	navigator.userAgent === "Cloudflare-Workers";

let nodeClient: PrismaClient | undefined;

/**
 * 取得 Prisma client（driver adapter）：
 * - Workers：每請求以 D1 binding 建立（binding 為請求範圍）
 * - Node（next dev / seed / scripts）：以本機 SQLite 檔建立單例
 *
 * 同一個 @prisma/client 在 Workers 上由 OpenNext 自動 patch wasm 載入方式。
 */
export async function getDb(): Promise<PrismaClient> {
	if (isWorkers) {
		const { PrismaD1 } = await import("@prisma/adapter-d1");
		const { getCloudflareContext } = await import("@opennextjs/cloudflare");
		const { env } = getCloudflareContext();
		return new PrismaClient({ adapter: new PrismaD1(env.DB) });
	}

	if (!nodeClient) {
		const { PrismaBetterSqlite3 } = await import(
			"@prisma/adapter-better-sqlite3"
		);
		const url = process.env.DATABASE_URL ?? "file:./prisma/db.sqlite";
		nodeClient = new PrismaClient({
			adapter: new PrismaBetterSqlite3({ url }),
		});
	}
	return nodeClient;
}
