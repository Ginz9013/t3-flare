/**
 * 產生 remote D1 用的單一管理員 seed SQL（user + credential account）。
 * 正式 D1 跑不了 node seed，故由此輸出 SQL，交給 `wrangler d1 execute --remote --file` 套用。
 * 密碼以 Better Auth 的雜湊器產生，確保登入時能驗證。
 * site-builder 於「初次部署」與「重設密碼」時皆使用（SQL 為 DELETE + INSERT，兩者通用）。
 *
 * 用法：ADMIN_EMAIL=you@example.com ADMIN_PASSWORD=... [ADMIN_NAME=Admin] \
 *         npx tsx scripts/gen-admin-sql.ts > admin.sql
 */
import { randomUUID } from "node:crypto";

// 僅需雜湊器，PrismaClient 為惰性連線、不會實際開啟此 DB；用記憶體位址避免副作用。
process.env.DATABASE_URL = "file::memory:";

const { getAuth } = await import("~/server/better-auth/config");
const { getDb } = await import("~/server/db");

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME ?? "Admin";

if (!email || !password) {
	console.error("需要環境變數 ADMIN_EMAIL 與 ADMIN_PASSWORD（密碼至少 8 碼）");
	process.exit(1);
}

/** SQL 字串字面值跳脫（單引號 → 兩個單引號） */
function q(s: string): string {
	return `'${s.replace(/'/g, "''")}'`;
}

const auth = getAuth(await getDb());
const ctx = await auth.$context;
const hashed = await ctx.password.hash(password);

const userId = randomUUID();
const accountId = randomUUID();

// 冪等且可重設：user 以 email 唯一鍵 OR IGNORE；credential account 先刪後插，
// 故「初次建立」與「重設密碼」用同一份 SQL 皆正確。
const sql = `INSERT OR IGNORE INTO "user" ("id","name","email","emailVerified","createdAt","updatedAt") VALUES (${q(userId)},${q(name)},${q(email)},1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
DELETE FROM "account" WHERE "providerId"='credential' AND "userId" IN (SELECT "id" FROM "user" WHERE "email"=${q(email)});
INSERT INTO "account" ("id","accountId","providerId","userId","password","createdAt","updatedAt") SELECT ${q(accountId)},u."id",'credential',u."id",${q(hashed)},CURRENT_TIMESTAMP,CURRENT_TIMESTAMP FROM "user" u WHERE u."email"=${q(email)};`;

console.log(sql);
process.exit(0);
