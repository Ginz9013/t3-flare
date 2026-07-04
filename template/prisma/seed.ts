import { randomUUID } from "node:crypto";

import { env } from "~/env";
import { getAuth } from "~/server/better-auth/config";
import { getDb } from "~/server/db";

const db = await getDb();
const auth = getAuth(db);

// ── 管理員帳號（帳密讀自 .env，不進版控）──────────────────────────
// 本機 dev 用此 seed；正式 D1 因跑不了 node script，改用 wrangler d1 execute + SQL
// （site-butler skill 於部署時自動處理）。
async function seedAdmin() {
	const email = env.ADMIN_EMAIL;
	const password = env.ADMIN_PASSWORD;
	const name = env.ADMIN_NAME ?? "Admin";

	if (!email || !password) {
		console.warn(
			"⚠ 略過管理員建立：請於 .env 設定 ADMIN_EMAIL 與 ADMIN_PASSWORD（密碼至少 8 碼）",
		);
		return;
	}

	// 以 Better Auth 的雜湊器產生密碼，確保登入時能驗證
	const ctx = await auth.$context;
	const hashed = await ctx.password.hash(password);

	let user = await db.user.findUnique({ where: { email } });
	if (!user) {
		user = await db.user.create({
			data: { id: randomUUID(), email, name, emailVerified: true },
		});
		console.log(`✓ 管理員 user 建立：${email}`);
	} else {
		console.log(`• 管理員 user 已存在：${email}`);
	}

	// credential 憑證（email/password）
	const account = await db.account.findFirst({
		where: { userId: user.id, providerId: "credential" },
	});
	if (!account) {
		await db.account.create({
			data: {
				id: randomUUID(),
				accountId: user.id,
				providerId: "credential",
				userId: user.id,
				password: hashed,
			},
		});
		console.log("✓ 管理員密碼憑證建立");
	} else {
		await db.account.update({
			where: { id: account.id },
			data: { password: hashed },
		});
		console.log("• 管理員密碼已更新");
	}
}

async function main() {
	await seedAdmin();
}

main()
	.then(async () => {
		await db.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await db.$disconnect();
		process.exit(1);
	});
