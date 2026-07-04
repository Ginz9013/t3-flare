/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
	// 讓 Prisma client 交給 OpenNext 於 workerd 端打包/patch，而非 webpack
	serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default config;

// 讓 `next dev` 期間可使用 Cloudflare 綁定（getCloudflareContext）
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
void initOpenNextCloudflareForDev();
