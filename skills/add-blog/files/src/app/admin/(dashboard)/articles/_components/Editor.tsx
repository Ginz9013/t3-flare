"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import {
	Bold,
	Code2,
	Heading2,
	Heading3,
	ImageIcon,
	Italic,
	List,
	ListOrdered,
	Quote,
	Redo2,
	Strikethrough,
	Undo2,
} from "lucide-react";
import { useCallback, useRef } from "react";
import { toast } from "sonner";

import { tiptapExtensions } from "~/lib/tiptap-extensions";
import { cn } from "~/lib/utils";

/** 上傳單一圖片檔到 R2，回傳對外網址（需專案保留 R2 模組 / /api/upload） */
async function uploadImage(file: File): Promise<string> {
	const fd = new FormData();
	fd.append("files", file);
	const res = await fetch("/api/upload", { method: "POST", body: fd });
	if (!res.ok) {
		const d = (await res.json().catch(() => ({}))) as { error?: string };
		throw new Error(d.error ?? "上傳失敗（此功能需要圖片上傳 / R2）");
	}
	const { urls } = (await res.json()) as { urls: string[] };
	const url = urls[0];
	if (!url) throw new Error("上傳失敗");
	return url;
}

function ToolbarButton({
	onClick,
	active,
	disabled,
	title,
	children,
}: {
	onClick: () => void;
	active?: boolean;
	disabled?: boolean;
	title: string;
	children: React.ReactNode;
}) {
	return (
		<button
			className={cn(
				"flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40",
				active && "bg-accent text-foreground",
			)}
			disabled={disabled}
			onClick={onClick}
			title={title}
			type="button"
		>
			{children}
		</button>
	);
}

export function Editor({
	value,
	onChange,
}: {
	value: unknown;
	onChange: (json: unknown) => void;
}) {
	const fileRef = useRef<HTMLInputElement>(null);

	const editor = useEditor({
		extensions: tiptapExtensions,
		content: (value as object) ?? "",
		immediatelyRender: false, // 避免 Next.js SSR hydration mismatch
		editorProps: {
			attributes: {
				class: "prose-article min-h-[420px] px-5 py-4 focus:outline-none",
			},
			handleDrop(_view, event) {
				const files = Array.from(event.dataTransfer?.files ?? []).filter((f) =>
					f.type.startsWith("image/"),
				);
				if (files.length === 0) return false;
				event.preventDefault();
				void insertFiles(files);
				return true;
			},
			handlePaste(_view, event) {
				const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
					f.type.startsWith("image/"),
				);
				if (files.length === 0) return false;
				event.preventDefault();
				void insertFiles(files);
				return true;
			},
		},
		onUpdate: ({ editor }) => onChange(editor.getJSON()),
	});

	const insertFiles = useCallback(
		async (files: File[]) => {
			if (!editor) return;
			for (const file of files) {
				try {
					const url = await uploadImage(file);
					editor.chain().focus().setImage({ src: url }).run();
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "圖片上傳失敗");
				}
			}
		},
		[editor],
	);

	const onPickImage = useCallback(
		async (e: React.ChangeEvent<HTMLInputElement>) => {
			const files = Array.from(e.target.files ?? []);
			if (files.length) await insertFiles(files);
			if (fileRef.current) fileRef.current.value = "";
		},
		[insertFiles],
	);

	if (!editor) return null;

	return (
		<div className="overflow-hidden rounded-2xl border border-border bg-card">
			<div className="flex flex-wrap items-center gap-0.5 border-border border-b px-2 py-1.5">
				<ToolbarButton
					active={editor.isActive("bold")}
					onClick={() => editor.chain().focus().toggleBold().run()}
					title="粗體"
				>
					<Bold className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("italic")}
					onClick={() => editor.chain().focus().toggleItalic().run()}
					title="斜體"
				>
					<Italic className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("strike")}
					onClick={() => editor.chain().focus().toggleStrike().run()}
					title="刪除線"
				>
					<Strikethrough className="size-4" />
				</ToolbarButton>

				<span className="mx-1 h-5 w-px bg-border" />

				<ToolbarButton
					active={editor.isActive("heading", { level: 2 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
					title="標題 H2"
				>
					<Heading2 className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("heading", { level: 3 })}
					onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
					title="標題 H3"
				>
					<Heading3 className="size-4" />
				</ToolbarButton>

				<span className="mx-1 h-5 w-px bg-border" />

				<ToolbarButton
					active={editor.isActive("bulletList")}
					onClick={() => editor.chain().focus().toggleBulletList().run()}
					title="項目清單"
				>
					<List className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("orderedList")}
					onClick={() => editor.chain().focus().toggleOrderedList().run()}
					title="編號清單"
				>
					<ListOrdered className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("blockquote")}
					onClick={() => editor.chain().focus().toggleBlockquote().run()}
					title="引用"
				>
					<Quote className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					active={editor.isActive("codeBlock")}
					onClick={() => editor.chain().focus().toggleCodeBlock().run()}
					title="程式碼區塊"
				>
					<Code2 className="size-4" />
				</ToolbarButton>

				<span className="mx-1 h-5 w-px bg-border" />

				<ToolbarButton onClick={() => fileRef.current?.click()} title="插入圖片">
					<ImageIcon className="size-4" />
				</ToolbarButton>

				<span className="mx-1 h-5 w-px bg-border" />

				<ToolbarButton
					disabled={!editor.can().undo()}
					onClick={() => editor.chain().focus().undo().run()}
					title="復原"
				>
					<Undo2 className="size-4" />
				</ToolbarButton>
				<ToolbarButton
					disabled={!editor.can().redo()}
					onClick={() => editor.chain().focus().redo().run()}
					title="重做"
				>
					<Redo2 className="size-4" />
				</ToolbarButton>
			</div>

			<EditorContent editor={editor} />

			<input
				accept="image/*"
				hidden
				multiple
				onChange={onPickImage}
				ref={fileRef}
				type="file"
			/>
		</div>
	);
}
