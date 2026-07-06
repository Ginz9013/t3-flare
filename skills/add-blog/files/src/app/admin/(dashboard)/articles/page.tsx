import Link from "next/link";

import { Button } from "~/components/ui/button";
import { ArticlesTable } from "./_components/ArticlesTable";

export const metadata = { title: "文章管理" };

export default function AdminArticlesPage() {
	return (
		<div className="space-y-6">
			<div className="flex items-end justify-between gap-4">
				<div>
					<h1 className="font-semibold text-2xl">文章</h1>
					<p className="text-muted-foreground text-sm">
						以 tiptap 編輯器撰寫、發佈部落格文章。
					</p>
				</div>
				<Button render={<Link href="/admin/articles/new">新增文章</Link>} />
			</div>
			<ArticlesTable />
		</div>
	);
}
