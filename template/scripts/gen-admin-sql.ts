/**
 * Generate single-admin seed SQL for remote D1 (user + credential account).
 * Production D1 can't run the node seed, so this outputs SQL to apply via `wrangler d1 execute --remote --file`.
 * The password is hashed with Better Auth's hasher so it verifies at login.
 * site-builder uses this for both "first deploy" and "password reset" (the SQL is DELETE + INSERT, working for both).
 *
 * Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... [ADMIN_NAME=Admin] \
 *         npx tsx scripts/gen-admin-sql.ts > admin.sql
 */
import { randomUUID } from "node:crypto";

// Only the hasher is needed; PrismaClient connects lazily and won't actually open this DB. Use an in-memory address to avoid side effects.
process.env.DATABASE_URL = "file::memory:";

const { getAuth } = await import("~/server/better-auth/config");
const { getDb } = await import("~/server/db");

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin";

if (!email || !password) {
	console.error("ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required (password at least 8 characters)");
	process.exit(1);
}

/** Escape a SQL string literal (single quote → two single quotes) */
function q(s: string): string {
	return `'${s.replace(/'/g, "''")}'`;
}

const auth = getAuth(await getDb());
const ctx = await auth.$context;
const hashed = await ctx.password.hash(password);

const userId = randomUUID();
const accountId = randomUUID();

// Idempotent and resettable: the user is OR IGNORE'd on the email unique key; the credential account is delete-then-insert,
// so the same SQL is correct for both "first creation" and "password reset".
const sql = `INSERT OR IGNORE INTO "user" ("id","name","email","emailVerified","createdAt","updatedAt") VALUES (${q(userId)},${q(name)},${q(email)},1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
DELETE FROM "account" WHERE "providerId"='credential' AND "userId" IN (SELECT "id" FROM "user" WHERE "email"=${q(email)});
INSERT INTO "account" ("id","accountId","providerId","userId","password","createdAt","updatedAt") SELECT ${q(accountId)},u."id",'credential',u."id",${q(hashed)},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM "user" u WHERE u."email"=${q(email)};`;

console.log(sql);
process.exit(0);
