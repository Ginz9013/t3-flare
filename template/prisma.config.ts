import { defineConfig } from "prisma/config";

// Prisma 7 no longer auto-loads .env, so load it manually here (built into Node 20.12+).
try {
	process.loadEnvFile();
} catch {
	// Ignore if .env doesn't exist
}

// Prisma 7: datasource URL and migrations config live here (used by CLI / Migrate).
// At runtime the app always connects via the driver adapter and doesn't rely on this url.
// Use process.env + fallback (instead of env() which throws) so install/generate works without .env.
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
