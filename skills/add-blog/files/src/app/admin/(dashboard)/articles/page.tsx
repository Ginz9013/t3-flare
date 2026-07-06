import Link from "next/link";

import { Button } from "~/components/ui/button";
import { ArticlesTable } from "./_components/ArticlesTable";

export const metadata = { title: "Manage articles" };

export default function AdminArticlesPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">Articles</h1>
					<p className="text-muted-foreground text-sm">
						Write and publish blog articles with the tiptap editor.
					</p>
				</div>
				<Button render={<Link href="/admin/articles/new">New article</Link>} />
			</div>
			<ArticlesTable />
		</div>
	);
}
