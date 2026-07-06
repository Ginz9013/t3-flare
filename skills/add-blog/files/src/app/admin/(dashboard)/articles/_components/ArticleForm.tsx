"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { extractPlainText } from "~/lib/tiptap-content";
import { api } from "~/trpc/react";

// The editor loads on the client only (ssr:false): this keeps the whole Tiptap/ProseMirror
// stack out of the Cloudflare Worker server bundle (which would exceed the size limit).
const Editor = dynamic(() => import("./Editor").then((m) => m.Editor), {
	ssr: false,
	loading: () => (
		<div className="min-h-[480px] rounded-2xl border border-border bg-card p-5 text-muted-foreground text-sm">
			Loading editor…
		</div>
	),
});

type Props = { mode: "new" | "edit"; articleId?: string };

type FormState = {
	title: string;
	slug: string;
	excerpt: string;
	content: unknown;
	status: "draft" | "published";
	publishedAt: string; // datetime-local string
};

const EMPTY: FormState = {
	title: "",
	slug: "",
	excerpt: "",
	content: null,
	status: "draft",
	publishedAt: "",
};

/** Date → local string for <input type="datetime-local"> (seconds dropped) */
const toLocalInput = (d: Date) => {
	const tz = d.getTimezoneOffset() * 60000;
	return new Date(d.getTime() - tz).toISOString().slice(0, 16);
};

const labelCls = "text-[11px] uppercase tracking-[0.2em] text-muted-foreground";

export function ArticleForm({ mode, articleId }: Props) {
	const router = useRouter();
	const utils = api.useUtils();
	const [form, setForm] = useState<FormState>(EMPTY);
	const [lockSlug, setLockSlug] = useState(false);

	const existing = api.article.byId.useQuery(
		{ id: articleId ?? "" },
		{ enabled: mode === "edit" && !!articleId },
	);

	useEffect(() => {
		const p = existing.data;
		if (mode !== "edit" || !p) return;
		setForm({
			title: p.title,
			slug: p.slug,
			excerpt: p.excerpt,
			content: p.content,
			status: p.status === "published" ? "published" : "draft",
			publishedAt: p.publishedAt ? toLocalInput(new Date(p.publishedAt)) : "",
		});
		setLockSlug(!!p.publishedAt); // Lock the slug after publishing
	}, [existing.data, mode]);

	const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
		setForm((f) => ({ ...f, [key]: value }));

	const onDone = async () => {
		await utils.article.list.invalidate();
		router.push("/admin/articles");
		router.refresh();
	};

	const create = api.article.create.useMutation({
		onSuccess: async () => {
			toast.success("Article created");
			await onDone();
		},
		onError: (e) => toast.error(e.message),
	});
	const update = api.article.update.useMutation({
		onSuccess: async () => {
			toast.success("Article updated");
			await onDone();
		},
		onError: (e) => toast.error(e.message),
	});

	const saving = create.isPending || update.isPending;

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!form.title.trim()) return toast.error("Please enter a title");
		if (!form.slug.trim()) return toast.error("Please enter a URL slug");
		if (!form.excerpt.trim()) return toast.error("Please enter an excerpt");
		if (!extractPlainText(form.content).trim())
			return toast.error("Please enter article content");

		const payload = {
			title: form.title.trim(),
			slug: form.slug.trim(),
			excerpt: form.excerpt.trim(),
			content: form.content ?? {},
			status: form.status,
			publishedAt: form.publishedAt ? new Date(form.publishedAt) : undefined,
		};

		if (mode === "edit" && articleId)
			update.mutate({ id: articleId, ...payload });
		else create.mutate(payload);
	};

	if (mode === "edit" && existing.isLoading) {
		return <p className="text-muted-foreground text-sm">Loading…</p>;
	}

	return (
		<form
			className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]"
			onSubmit={onSubmit}
		>
			{/* Left: main content */}
			<div className="flex flex-col gap-6">
				<div className="grid gap-2">
					<Label className={labelCls} htmlFor="title">
						Title
					</Label>
					<Input
						id="title"
						onChange={(e) => set("title", e.target.value)}
						placeholder="Article title"
						value={form.title}
					/>
				</div>

				<div className="grid gap-2">
					<Label className={labelCls} htmlFor="excerpt">
						Excerpt (required)
					</Label>
					<Textarea
						id="excerpt"
						onChange={(e) => set("excerpt", e.target.value)}
						placeholder="A short excerpt, used for list cards and share descriptions"
						rows={3}
						value={form.excerpt}
					/>
				</div>

				<div className="grid gap-2">
					<Label className={labelCls}>Content</Label>
					<Editor onChange={(json) => set("content", json)} value={form.content} />
				</div>
			</div>

			{/* Right: publish panel */}
			<aside className="flex h-fit flex-col gap-5 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6">
				<div className="grid gap-2">
					<Label className={labelCls} htmlFor="slug">
						Slug (URL, required)
					</Label>
					<Input
						className={lockSlug ? "opacity-60" : undefined}
						id="slug"
						onChange={(e) => set("slug", e.target.value)}
						placeholder="my-first-post"
						readOnly={lockSlug}
						value={form.slug}
					/>
					{lockSlug && (
						<p className="text-[10px] text-muted-foreground">
							Published — slug locked to avoid broken links
						</p>
					)}
				</div>

				<div className="grid gap-2">
					<Label className={labelCls} htmlFor="publishedAt">
						Published At (leave blank to fill automatically)
					</Label>
					<Input
						id="publishedAt"
						onChange={(e) => set("publishedAt", e.target.value)}
						type="datetime-local"
						value={form.publishedAt}
					/>
				</div>

				<div className="flex items-center justify-between">
					<Label className={labelCls} htmlFor="published">
						Publish
					</Label>
					<Switch
						checked={form.status === "published"}
						id="published"
						onCheckedChange={(v) => set("status", v ? "published" : "draft")}
					/>
				</div>

				<Button className="mt-1 h-10 rounded-full" disabled={saving} type="submit">
					{saving ? "Saving…" : mode === "edit" ? "Update article" : "Create article"}
				</Button>
			</aside>
		</form>
	);
}
