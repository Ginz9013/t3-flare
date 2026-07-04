import { headers } from "next/headers";

import { getAuth } from "~/server/better-auth";
import { getDb } from "~/server/db";

/** 於 Server Component / Route Handler 取得目前登入 session（未登入回傳 null） */
export async function getServerSession() {
	const auth = getAuth(await getDb());
	return auth.api.getSession({ headers: await headers() });
}
