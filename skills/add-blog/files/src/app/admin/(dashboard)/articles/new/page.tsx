import { ArticleForm } from "../_components/ArticleForm";

export const metadata = { title: "新增文章" };

export default function NewArticlePage() {
	return (
		<div className="space-y-6">
			<h1 className="font-semibold text-2xl">新增文章</h1>
			<ArticleForm mode="new" />
		</div>
	);
}
