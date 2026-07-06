import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RenderArticle } from "~/lib/render-article";
import { api } from "~/trpc/server";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function getArticle(slug: string) {
	try {
		return await api.article.publicBySlug({ slug });
	} catch {
		return null;
	}
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
	const { slug } = await params;
	const article = await getArticle(slug);
	if (!article) return { title: "Article not found" };

	return {
		title: article.title,
		description: article.excerpt,
		alternates: { canonical: `/articles/${slug}` },
		openGraph: {
			type: "article",
			title: article.title,
			description: article.excerpt,
			publishedTime: article.publishedAt?.toISOString(),
		},
		twitter: {
			card: "summary_large_image",
			title: article.title,
			description: article.excerpt,
		},
	};
}

function fmtDate(d: Date | null) {
	if (!d) return null;
	return new Date(d).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export default async function ArticlePage({ params }: Params) {
	const { slug } = await params;
	const article = await getArticle(slug);
	if (!article) notFound();

	const date = fmtDate(article.publishedAt);
	const isDraft = article.status !== "published";

	return (
		<main className="mx-auto min-h-screen max-w-2xl px-6 py-24">
			<Link
				className="text-muted-foreground text-xs uppercase tracking-[0.28em] transition-colors hover:text-foreground"
				href="/articles"
			>
				← Articles
			</Link>

			{isDraft && (
				<div className="mt-8 rounded-lg border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-amber-600 text-xs dark:text-amber-200">
					草稿預覽 — 僅登入的管理員可見
				</div>
			)}

			<header className="mt-8 mb-12">
				<h1 className="font-semibold text-3xl leading-tight tracking-tight sm:text-4xl">
					{article.title}
				</h1>
				<div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-muted-foreground text-xs">
					{date && <time className="font-mono">{date}</time>}
					<span className="font-mono">{article.readingTime} min read</span>
				</div>
			</header>

			<article className="prose-article">
				<RenderArticle content={article.content} />
			</article>
		</main>
	);
}
