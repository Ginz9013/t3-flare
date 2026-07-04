import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "~/env";
import type { DB } from "~/server/db";

/**
 * 以給定的 Prisma client 建立 Better Auth 實例。
 * 因 D1 binding 為請求範圍，auth 改為 per-request 由 db 建立。
 */
export function getAuth(db: DB) {
	return betterAuth({
		baseURL: env.BETTER_AUTH_URL,
		database: prismaAdapter(db, {
			provider: "sqlite",
		}),
		emailAndPassword: {
			enabled: true,
			// 單一管理員：關閉公開註冊，僅以 seed / CLI 建立管理員帳號
			disableSignUp: true,
		},
	});
}

export type Auth = ReturnType<typeof getAuth>;
export type Session = Auth["$Infer"]["Session"];
