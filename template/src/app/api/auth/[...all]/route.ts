import { getAuth } from "~/server/better-auth";
import { getDb } from "~/server/db";

// auth 為 per-request（D1 binding 屬請求範圍），於 handler 內建立
async function handler(req: Request) {
	const auth = getAuth(await getDb());
	return auth.handler(req);
}

export { handler as GET, handler as POST };
