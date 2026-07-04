import { headers } from "next/headers";
import { cache } from "react";
import { getDb } from "~/server/db";
import { getAuth } from ".";

export const getSession = cache(async () => {
	const auth = getAuth(await getDb());
	return auth.api.getSession({ headers: await headers() });
});
