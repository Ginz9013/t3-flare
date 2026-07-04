import { headers } from "next/headers";
import { cache } from "react";

import { getAuth } from ".";
import { getDb } from "~/server/db";

export const getSession = cache(async () => {
	const auth = getAuth(await getDb());
	return auth.api.getSession({ headers: await headers() });
});
