import { getAuth } from "~/server/better-auth";
import { getDb } from "~/server/db";

// auth is per-request (the D1 binding is request-scoped), so create it inside the handler
async function handler(req: Request) {
	const auth = getAuth(await getDb());
	return auth.handler(req);
}

export { handler as GET, handler as POST };
