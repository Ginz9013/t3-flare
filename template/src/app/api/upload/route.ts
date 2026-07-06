import { getServerSession } from "~/server/better-auth/session";
import { putObject, uploadKey } from "~/server/r2";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB per file

// [module:r2] Admin image upload → R2, returns a public /media URL
export async function POST(req: Request) {
	const session = await getServerSession();
	if (!session) return new Response("Unauthorized", { status: 401 });

	const form = await req.formData();
	const files = form
		.getAll("files")
		.filter((f): f is File => f instanceof File);
	if (files.length === 0) {
		return Response.json({ error: "no files" }, { status: 400 });
	}

	const urls: string[] = [];
	for (const file of files) {
		if (!file.type.startsWith("image/")) {
			return Response.json(
				{ error: "Only image files are allowed" },
				{ status: 400 },
			);
		}
		if (file.size > MAX_BYTES) {
			return Response.json(
				{ error: "Each file must be 10MB or smaller" },
				{ status: 400 },
			);
		}
		const url = await putObject(
			uploadKey(file.name),
			await file.arrayBuffer(),
			file.type,
		);
		urls.push(url);
	}

	return Response.json({ urls });
}
