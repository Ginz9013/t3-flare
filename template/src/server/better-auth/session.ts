import { headers } from "next/headers";

import { getAuth } from "~/server/better-auth";
import { getDb } from "~/server/db";

/** Get the current logged-in session in a Server Component / Route Handler (returns null if not logged in) */
export async function getServerSession() {
	const auth = getAuth(await getDb());
	return auth.api.getSession({ headers: await headers() });
}
