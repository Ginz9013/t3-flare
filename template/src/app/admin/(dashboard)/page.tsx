import { getDb } from "~/server/db";

export default async function DashboardHome() {
	const db = await getDb();
	const [total, published] = await Promise.all([
		db.post.count(),
		db.post.count({ where: { published: true } }),
	]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">總覽</h1>
				<p className="text-muted-foreground text-sm">歡迎回到 my-site 後台。</p>
			</div>
			<div className="grid grid-cols-2 gap-4 sm:max-w-md">
				<div className="rounded-xl border border-border p-5">
					<div className="text-muted-foreground text-sm">全部內容</div>
					<div className="mt-1 font-semibold text-3xl">{total}</div>
				</div>
				<div className="rounded-xl border border-border p-5">
					<div className="text-muted-foreground text-sm">已發佈</div>
					<div className="mt-1 font-semibold text-3xl">{published}</div>
				</div>
			</div>
		</div>
	);
}
