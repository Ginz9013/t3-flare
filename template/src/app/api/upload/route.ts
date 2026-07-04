import { getServerSession } from "~/server/better-auth/session";
import { putObject, uploadKey } from "~/server/r2";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024; // 單檔 10MB

// [module:r2] 後台圖片上傳 → R2，回傳 /media 對外網址
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
			return Response.json({ error: "只接受圖片檔" }, { status: 400 });
		}
		if (file.size > MAX_BYTES) {
			return Response.json({ error: "單檔不可超過 10MB" }, { status: 400 });
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
