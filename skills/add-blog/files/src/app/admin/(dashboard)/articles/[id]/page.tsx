import { ArticleForm } from "../_components/ArticleForm";

export const metadata = { title: "Edit article" };

export default async function EditArticlePage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	return (
		<div className="space-y-6">
			<h1 className="font-semibold text-2xl">Edit article</h1>
			<ArticleForm articleId={id} mode="edit" />
		</div>
	);
}
