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
		// 未設時由請求推導；設了則作為產生連結的正式網址（見 env）。
		baseURL: env.BETTER_AUTH_URL,
		// 動態信任「請求打到的來源」：免去部署前需知道 workers.dev 網址，
		// 亦自動涵蓋自訂網域與 localhost。跨站攻擊者的 Origin 與本站 host 不符仍會被擋，
		// 故等同「只信任同源」，安全無虞。
		trustedOrigins: (request) => {
			try {
				return request ? [new URL(request.url).origin] : [];
			} catch {
				return [];
			}
		},
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
