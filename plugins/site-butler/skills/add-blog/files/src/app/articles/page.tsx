import type { Metadata } from "next";

import { api, HydrateClient } from "~/trpc/server";
import { ArticlesList } from "./_components/ArticlesList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	title: "Articles",
	description: "文章與筆記。",
	alternates: { canonical: "/articles" },
};

export default async function ArticlesPage() {
	await api.article.publicList.prefetch();

	return (
		<HydrateClient>
			<main className="mx-auto min-h-screen max-w-2xl px-6 py-24">
				<header className="mb-12">
					<h1 className="font-semibold text-3xl tracking-tight">文章</h1>
				</header>
				<ArticlesList />
			</main>
		</HydrateClient>
	);
}
