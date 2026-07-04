import { defineConfig } from "prisma/config";

// Prisma 7 不再自動載入 .env，於此手動載入（Node 20.12+ 內建）。
try {
	process.loadEnvFile();
} catch {
	// .env 不存在時忽略
}

// Prisma 7：datasource URL 與 migrations 設定移到此處（CLI / Migrate 用）。
// 執行期（app）一律透過 driver adapter 連線，不依賴此 url。
// 用 process.env + fallback（而非會 throw 的 env()），讓無 .env 時也能 install/generate。
export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		path: "prisma/migrations",
		seed: "tsx ./prisma/seed.ts",
	},
	datasource: {
		url: process.env.DATABASE_URL ?? "file:./prisma/db.sqlite",
	},
});
