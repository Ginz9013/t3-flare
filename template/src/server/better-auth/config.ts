import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { env } from "~/env";
import type { DB } from "~/server/db";

/**
 * Create a Better Auth instance from the given Prisma client.
 * Since the D1 binding is request-scoped, auth is built per-request from the db.
 */
export function getAuth(db: DB) {
	return betterAuth({
		// When unset, it's derived from the request; when set, it's the canonical URL for generated links (see env).
		baseURL: env.BETTER_AUTH_URL,
		// Dynamically trust "the origin the request came in on": no need to know the workers.dev URL before deploying,
		// and it automatically covers custom domains and localhost. A cross-site attacker's Origin still won't match
		// this host and gets blocked, so this is equivalent to "trust same-origin only" and is safe.
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
			// Single admin: disable public sign-up; create the admin account only via seed / CLI
			disableSignUp: true,
		},
	});
}

export type Auth = ReturnType<typeof getAuth>;
export type Session = Auth["$Infer"]["Session"];
