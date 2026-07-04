import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * [module:r2] R2 媒體儲存的統一封裝。所有對 bucket 的操作都經此模組。
 * 對外服務路徑為 /media/<key>（由 app/media/[...key]/route.ts 提供）。
 */

const MEDIA_PREFIX = "/media/";

/** 取得 R2 bucket binding（async 版相容 next dev 與 Workers） */
async function getBucket() {
	const { env } = await getCloudflareContext({ async: true });
	return env.MEDIA;
}

/** key → 對外網址（/media/<key>） */
export function mediaUrl(key: string): string {
	return MEDIA_PREFIX + key;
}

/** /media/<key> 網址 → key（已是 key 則原樣回傳） */
export function keyFromUrl(url: string): string {
	return url.startsWith(MEDIA_PREFIX) ? url.slice(MEDIA_PREFIX.length) : url;
}

/** 上傳物件，回傳對外網址 */
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

/** 讀取物件（找不到回 null） */
export async function getObject(key: string) {
	const bucket = await getBucket();
	return bucket.get(key);
}

/** 刪除物件（可傳 key 或 /media/ 網址） */
export async function deleteObject(keyOrUrl: string): Promise<void> {
	const bucket = await getBucket();
	await bucket.delete(keyFromUrl(keyOrUrl));
}

/** 由副檔名推 content-type（R2 metadata 缺失時的後備） */
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

/** 產生上傳用的 key：uploads/<uuid>.<ext> */
export function uploadKey(filename: string): string {
	const ext = filename.split(".").pop()?.toLowerCase() ?? "bin";
	return `uploads/${crypto.randomUUID()}.${ext}`;
}
