import { randomUUID } from "node:crypto";

import { env } from "~/env";
import { getAuth } from "~/server/better-auth/config";
import { getDb } from "~/server/db";

const db = await getDb();
const auth = getAuth(db);

// ── Admin account (credentials read from .env, not committed to version control) ──────────────────────────
// Local dev uses this seed; production D1 can't run node scripts, so it uses wrangler d1 execute + SQL
// (handled automatically by the site-builder skill at deploy time).
async function seedAdmin() {
	const email = env.ADMIN_EMAIL;
	const password = env.ADMIN_PASSWORD;
	const name = env.ADMIN_NAME ?? "Admin";

	if (!email || !password) {
		console.warn(
			"⚠ Skipping admin creation: set ADMIN_EMAIL and ADMIN_PASSWORD in .env (password at least 8 characters)",
		);
		return;
	}

	// Hash the password with Better Auth's hasher so it verifies at login
	const ctx = await auth.$context;
	const hashed = await ctx.password.hash(password);

	let user = await db.user.findUnique({ where: { email } });
	if (!user) {
		user = await db.user.create({
			data: { id: randomUUID(), email, name, emailVerified: true },
		});
		console.log(`✓ Admin user created: ${email}`);
	} else {
		console.log(`• Admin user already exists: ${email}`);
	}

	// Credential account (email/password)
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
		console.log("✓ Admin password credential created");
	} else {
		await db.account.update({
			where: { id: account.id },
			data: { password: hashed },
		});
		console.log("• Admin password updated");
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
