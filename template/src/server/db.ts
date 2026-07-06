import { PrismaClient } from "@prisma/client";

export type DB = PrismaClient;

// Whether running in the Cloudflare Workers runtime (wrangler dev / production)
const isWorkers =
	typeof navigator !== "undefined" &&
	navigator.userAgent === "Cloudflare-Workers";

let nodeClient: PrismaClient | undefined;

/**
 * Get the Prisma client (driver adapter):
 * - Workers: created per request from the D1 binding (the binding is request-scoped)
 * - Node (next dev / seed / scripts): a singleton backed by a local SQLite file
 *
 * On Workers, OpenNext automatically patches how the same @prisma/client loads wasm.
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
