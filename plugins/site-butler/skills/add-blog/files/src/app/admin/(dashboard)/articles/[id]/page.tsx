import { ArticleForm } from "../_components/ArticleForm";

export const metadata = { title: "編輯文章" };

export default async function EditArticlePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return (
		<div className="space-y-6">
			<h1 className="font-semibold text-2xl">編輯文章</h1>
			<ArticleForm articleId={id} mode="edit" />
		</div>
	);
}
