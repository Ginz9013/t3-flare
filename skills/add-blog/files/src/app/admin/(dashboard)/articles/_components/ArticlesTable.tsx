"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { api } from "~/trpc/react";

function fmtDate(d: Date | null) {
	if (!d) return "—";
	return new Date(d).toLocaleDateString("zh-TW", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

export function ArticlesTable() {
	const utils = api.useUtils();
	const articles = api.article.list.useQuery();

	const del = api.article.delete.useMutation({
		onSuccess: async () => {
			toast.success("Article deleted");
			await utils.article.list.invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	const onDelete = (id: string, title: string) => {
		if (!window.confirm(`Delete "${title}"? This action cannot be undone.`)) return;
		del.mutate({ id });
	};

	if (articles.isLoading) {
		return <p className="text-muted-foreground text-sm">Loading…</p>;
	}

	const rows = articles.data ?? [];

	return (
		<div className="rounded-2xl border border-border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Title</TableHead>
						<TableHead className="w-24">Status</TableHead>
						<TableHead className="w-32 font-mono">Published</TableHead>
						<TableHead className="w-32 text-right">Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{rows.length === 0 && (
						<TableRow>
							<TableCell
								className="py-16 text-center text-muted-foreground text-sm"
								colSpan={4}
							>
								No articles yet. Click "New article" at the top right to start.
							</TableCell>
						</TableRow>
					)}
					{rows.map((p) => (
						<TableRow key={p.id}>
							<TableCell>
								<Link
									className="font-medium hover:underline"
									href={`/admin/articles/${p.id}`}
								>
									{p.title}
								</Link>
							</TableCell>
							<TableCell>
								{p.status === "published" ? (
									<Badge className="rounded-full">Published</Badge>
								) : (
									<Badge className="rounded-full" variant="secondary">
										Draft
									</Badge>
								)}
							</TableCell>
							<TableCell className="font-mono text-muted-foreground text-xs">
								{fmtDate(p.publishedAt)}
							</TableCell>
							<TableCell className="text-right">
								<div className="flex justify-end gap-2">
									<Button
										render={<Link href={`/admin/articles/${p.id}`} />}
										size="sm"
										variant="ghost"
									>
										Edit
									</Button>
									<Button
										className="text-destructive hover:text-destructive"
										disabled={del.isPending}
										onClick={() => onDelete(p.id, p.title)}
										size="sm"
										variant="ghost"
									>
										Delete
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	);
}
