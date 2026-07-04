"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Textarea } from "~/components/ui/textarea";
import { api } from "~/trpc/react";

export function PostManager() {
	const utils = api.useUtils();
	const list = api.post.list.useQuery();

	const [editingId, setEditingId] = useState<string | null>(null);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [published, setPublished] = useState(false);

	function reset() {
		setEditingId(null);
		setTitle("");
		setContent("");
		setPublished(false);
	}

	const create = api.post.create.useMutation({
		onSuccess: async () => {
			await utils.post.list.invalidate();
			reset();
			toast.success("已建立");
		},
		onError: (e) => toast.error(e.message),
	});
	const update = api.post.update.useMutation({
		onSuccess: async () => {
			await utils.post.list.invalidate();
			reset();
			toast.success("已更新");
		},
		onError: (e) => toast.error(e.message),
	});
	const remove = api.post.delete.useMutation({
		onSuccess: async () => {
			await utils.post.list.invalidate();
			toast.success("已刪除");
		},
		onError: (e) => toast.error(e.message),
	});

	function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (editingId) {
			update.mutate({ id: editingId, title, content, published });
		} else {
			create.mutate({ title, content, published });
		}
	}

	const pending = create.isPending || update.isPending;

	return (
		<div className="grid gap-8 lg:grid-cols-[360px_1fr]">
			<form
				className="h-fit space-y-4 rounded-xl border border-border p-5"
				onSubmit={onSubmit}
			>
				<h2 className="font-medium">{editingId ? "編輯內容" : "新增內容"}</h2>
				<div className="space-y-2">
					<Label htmlFor="title">標題</Label>
					<Input
						id="title"
						onChange={(e) => setTitle(e.target.value)}
						required
						value={title}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="content">內容</Label>
					<Textarea
						id="content"
						onChange={(e) => setContent(e.target.value)}
						rows={5}
						value={content}
					/>
				</div>
				<div className="flex items-center gap-2">
					<Switch
						checked={published}
						id="published"
						onCheckedChange={setPublished}
					/>
					<Label htmlFor="published">發佈</Label>
				</div>
				<div className="flex gap-2">
					<Button disabled={pending} type="submit">
						{pending ? "儲存中…" : editingId ? "更新" : "建立"}
					</Button>
					{editingId && (
						<Button onClick={reset} type="button" variant="ghost">
							取消
						</Button>
					)}
				</div>
			</form>

			<div className="rounded-xl border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>標題</TableHead>
							<TableHead className="w-24">狀態</TableHead>
							<TableHead className="w-32 text-right">操作</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{list.data?.length ? (
							list.data.map((post) => (
								<TableRow key={post.id}>
									<TableCell className="font-medium">{post.title}</TableCell>
									<TableCell className="text-muted-foreground text-sm">
										{post.published ? "已發佈" : "草稿"}
									</TableCell>
									<TableCell className="text-right">
										<Button
											onClick={() => {
												setEditingId(post.id);
												setTitle(post.title);
												setContent(post.content ?? "");
												setPublished(post.published);
											}}
											size="sm"
											variant="ghost"
										>
											編輯
										</Button>
										<Button
											onClick={() => {
												if (confirm(`確定刪除「${post.title}」？`)) {
													remove.mutate({ id: post.id });
												}
											}}
											size="sm"
											variant="ghost"
										>
											刪除
										</Button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									className="py-8 text-center text-muted-foreground text-sm"
									colSpan={3}
								>
									{list.isLoading ? "載入中…" : "尚無內容，從左側新增。"}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
