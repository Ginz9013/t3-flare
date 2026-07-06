"use client";

import Link from "next/link";

import { api } from "~/trpc/react";

function fmtDate(d: Date | null) {
	if (!d) return null;
	return new Date(d).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
	});
}

export function ArticlesList() {
	const list = api.article.publicList.useQuery();

	if (list.isLoading) {
		return <p className="text-muted-foreground text-sm">Loading…</p>;
	}

	const items = list.data ?? [];
	if (items.length === 0) {
		return <p className="text-muted-foreground text-sm">No articles yet.</p>;
	}

	return (
		<ul className="flex flex-col gap-10">
			{items.map((post) => {
				const date = fmtDate(post.publishedAt);
				return (
					<li key={post.id}>
						<Link className="group block" href={`/articles/${post.slug}`}>
							<div className="mb-2 flex items-center gap-3 text-muted-foreground text-xs">
								{date && <time className="font-mono">{date}</time>}
								<span className="font-mono">{post.readingTime} min read</span>
							</div>
							<h2 className="font-medium text-xl tracking-tight group-hover:underline">
								{post.title}
							</h2>
							<p className="mt-2 text-muted-foreground">{post.excerpt}</p>
						</Link>
					</li>
				);
			})}
		</ul>
	);
}
