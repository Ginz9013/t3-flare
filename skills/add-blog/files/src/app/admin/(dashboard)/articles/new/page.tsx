import { ArticleForm } from "../_components/ArticleForm";

export const metadata = { title: "New article" };

export default function NewArticlePage() {
	return (
		<div className="space-y-6">
			<h1 className="font-semibold text-2xl">New article</h1>
			<ArticleForm mode="new" />
		</div>
	);
}
