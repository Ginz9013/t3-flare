import { PostManager } from "./_components/post-manager";

export default function PostsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">內容（Posts）</h1>
				<p className="text-muted-foreground text-sm">
					這是後台 CRUD 的示範資源，示範 tRPC + Prisma + D1 的完整讀寫。
				</p>
			</div>
			<PostManager />
		</div>
	);
}
