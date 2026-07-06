import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
	/**
	 * Specify your server-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars.
	 */
	server: {
		BETTER_AUTH_SECRET:
			process.env.NODE_ENV === "production"
				? z.string()
				: z.string().optional(),
		// Public URL (e.g. http://localhost:3000 / https://<name>.workers.dev)
		BETTER_AUTH_URL: z.string().url().optional(),
		// On Node (next dev / seed) uses local SQLite; Workers uses the D1 binding instead, so it's optional
		DATABASE_URL: z.string().url().optional(),
		NODE_ENV: z
			.enum(["development", "test", "production"])
			.default("development"),
		// Seed only: create the single admin account (not committed to version control)
		ADMIN_EMAIL: z.string().email().optional(),
		ADMIN_PASSWORD: z.string().min(8).optional(),
		ADMIN_NAME: z.string().optional(),
	},

	/**
	 * Specify your client-side environment variables schema here. This way you can ensure the app
	 * isn't built with invalid env vars. To expose them to the client, prefix them with
	 * `NEXT_PUBLIC_`.
	 */
	client: {
		// NEXT_PUBLIC_CLIENTVAR: z.string(),
	},

	/**
	 * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
	 * middlewares) or client-side so we need to destruct manually.
	 */
	runtimeEnv: {
		BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
		DATABASE_URL: process.env.DATABASE_URL,
		NODE_ENV: process.env.NODE_ENV,
		ADMIN_EMAIL: process.env.ADMIN_EMAIL,
		ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
		ADMIN_NAME: process.env.ADMIN_NAME,
	},
	/**
	 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
	 * useful for Docker builds.
	 */
	skipValidation: !!process.env.SKIP_ENV_VALIDATION,
	/**
	 * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
	 * `SOME_VAR=''` will throw an error.
	 */
	emptyStringAsUndefined: true,
});
