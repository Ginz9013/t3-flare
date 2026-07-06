/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
	// Let OpenNext bundle/patch the Prisma client on the workerd side instead of webpack
	serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default config;

// Make Cloudflare bindings available during `next dev` (getCloudflareContext)
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

void initOpenNextCloudflareForDev();
