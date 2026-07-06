import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * [module:r2] Unified wrapper for R2 media storage. All bucket operations go through this module.
 * The public serving path is /media/<key> (served by app/media/[...key]/route.ts).
 */

const MEDIA_PREFIX = "/media/";

/** Get the R2 bucket binding (async version, compatible with both next dev and Workers) */
async function getBucket() {
	const { env } = await getCloudflareContext({ async: true });
	return env.MEDIA;
}

/** key → public URL (/media/<key>) */
export function mediaUrl(key: string): string {
	return MEDIA_PREFIX + key;
}

/** /media/<key> URL → key (returns as-is if it's already a key) */
export function keyFromUrl(url: string): string {
	return url.startsWith(MEDIA_PREFIX) ? url.slice(MEDIA_PREFIX.length) : url;
}

/** Upload an object and return its public URL */
export async function putObject(
	key: string,
	body: ArrayBuffer | string,
	contentType?: string,
): Promise<string> {
	const bucket = await getBucket();
	await bucket.put(key, body, {
		httpMetadata: contentType ? { contentType } : undefined,
	});
	return mediaUrl(key);
}

/** Read an object (returns null if not found) */
export async function getObject(key: string) {
	const bucket = await getBucket();
	return bucket.get(key);
}

/** Delete an object (accepts either a key or a /media/ URL) */
export async function deleteObject(keyOrUrl: string): Promise<void> {
	const bucket = await getBucket();
	await bucket.delete(keyFromUrl(keyOrUrl));
}

/** Guess the content-type from the file extension (fallback when R2 metadata is missing) */
export function guessContentType(key: string): string {
	const ext = key.split(".").pop()?.toLowerCase();
	switch (ext) {
		case "png":
			return "image/png";
		case "webp":
			return "image/webp";
		case "gif":
			return "image/gif";
		case "svg":
			return "image/svg+xml";
		case "avif":
			return "image/avif";
		default:
			return "image/jpeg";
	}
}

/** Generate an upload key: uploads/<uuid>.<ext> */
export function uploadKey(filename: string): string {
	const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
	return `uploads/${crypto.randomUUID()}.${ext}`;
}
