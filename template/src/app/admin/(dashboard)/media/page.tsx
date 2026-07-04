"use client";

// [module:r2] 媒體上傳示範頁 — 移除 R2 模組時一併刪除整個 media/ 目錄
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";

import { Input } from "~/components/ui/input";

export default function MediaPage() {
	const [urls, setUrls] = useState<string[]>([]);
	const [uploading, setUploading] = useState(false);

	async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
		const files = e.target.files;
		if (!files || files.length === 0) return;

		const form = new FormData();
		for (const file of files) form.append("files", file);

		setUploading(true);
		const res = await fetch("/api/upload", { method: "POST", body: form });
		setUploading(false);

		if (!res.ok) {
			const data = (await res.json().catch(() => ({}))) as { error?: string };
			toast.error(data.error ?? "上傳失敗");
			return;
		}
		const data = (await res.json()) as { urls: string[] };
		setUrls((prev) => [...data.urls, ...prev]);
		toast.success(`已上傳 ${data.urls.length} 張`);
		e.target.value = "";
	}

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">媒體</h1>
				<p className="text-muted-foreground text-sm">
					上傳圖片到 R2，回傳 /media 對外網址。示範 R2 綁定的完整讀寫。
				</p>
			</div>

			<div className="flex items-center gap-3">
				<Input
					accept="image/*"
					className="max-w-xs"
					disabled={uploading}
					multiple
					onChange={onUpload}
					type="file"
				/>
				{uploading && (
					<span className="text-muted-foreground text-sm">上傳中…</span>
				)}
			</div>

			{urls.length > 0 && (
				<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{urls.map((url) => (
						<a
							className="block overflow-hidden rounded-lg border border-border"
							href={url}
							key={url}
							rel="noreferrer"
							target="_blank"
						>
							<Image
								alt=""
								className="aspect-square w-full object-cover"
								height={240}
								src={url}
								unoptimized
								width={240}
							/>
						</a>
					))}
				</div>
			)}
		</div>
	);
}
