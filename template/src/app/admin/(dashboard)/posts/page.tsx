import { PostManager } from "./_components/post-manager";

export default function PostsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">Posts</h1>
				<p className="text-muted-foreground text-sm">
					A sample CRUD resource demonstrating full read/write with tRPC +
					Prisma + D1.
				</p>
			</div>
			<PostManager />
		</div>
	);
}
