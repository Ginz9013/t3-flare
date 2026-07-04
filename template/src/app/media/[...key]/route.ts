import { getObject, guessContentType } from "~/server/r2";

export const dynamic = "force-dynamic";

// [module:r2] 由 R2 提供媒體：/media/uploads/<uuid>.jpg → R2 key "uploads/<uuid>.jpg"
export async function GET(
	_req: Request,
	{ params }: { params: Promise<{ key: string[] }> },
) {
	const { key } = await params;
	const objectKey = key.map((k) => decodeURIComponent(k)).join("/");

	const obj = await getObject(objectKey);
	if (!obj) return new Response("Not found", { status: 404 });

	const headers = new Headers();
	headers.set(
		"content-type",
		obj.httpMetadata?.contentType ?? guessContentType(objectKey),
	);
	headers.set("etag", obj.httpEtag);
	headers.set("Cache-Control", "public, max-age=31536000, immutable");
	return new Response(obj.body as unknown as ReadableStream, { headers });
}
