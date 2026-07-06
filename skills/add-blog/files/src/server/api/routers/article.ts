import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { slugify } from "~/lib/slug";
import { extractPlainText, readingTimeMinutes } from "~/lib/tiptap-content";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import type { DB } from "~/server/db";

const articleInput = z.object({
	title: z.string().min(1, "Please enter a title"),
	slug: z.string().min(1, "Please enter a URL slug"),
	excerpt: z.string().min(1, "Please enter an excerpt"),
	content: z.unknown(), // Tiptap ProseMirror JSON document
	status: z.enum(["draft", "published"]).default("draft"),
	// Optional: manually set the publish time; if omitted, the first publish fills it in automatically
	publishedAt: z.coerce.date().optional().nullable(),
});

type ArticleInput = z.infer<typeof articleInput>;

/** Generate a unique slug; append a number on collision (excluding itself) */
async function uniqueSlug(db: DB, base: string, excludeId?: string) {
	const root = slugify(base) || "post";
	let slug = root;
	let n = 1;
	while (true) {
		const existing = await db.article.findUnique({ where: { slug } });
		if (!existing || existing.id === excludeId) return slug;
		n += 1;
		slug = `${root}-${n}`;
	}
}

/** Compute the content-derived fields to write to the DB from the input */
function contentFields(input: ArticleInput) {
	return {
		content: JSON.stringify(input.content ?? {}),
		plainText: extractPlainText(input.content),
	};
}

export const articleRouter = createTRPCRouter({
	// ── Admin list ─────────────────────────────────────────────
	list: protectedProcedure.query(({ ctx }) =>
		ctx.db.article.findMany({ orderBy: { updatedAt: "desc" } }),
	),

	// ── Public list: latest published ──────────────────────────
	publicList: publicProcedure
		.input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db.article.findMany({
				where: { status: "published" },
				orderBy: [{ publishedAt: "desc" }, { id: "desc" }],
				take: input?.limit ?? 20,
				select: {
					id: true,
					title: true,
					slug: true,
					excerpt: true,
					plainText: true,
					publishedAt: true,
				},
			});
			return rows.map(({ plainText, ...rest }) => ({
				...rest,
				readingTime: readingTimeMinutes(plainText),
			}));
		}),

	// ── For sitemap: slugs and timestamps of all published articles ──
	publishedSlugs: publicProcedure.query(({ ctx }) =>
		ctx.db.article.findMany({
			where: { status: "published" },
			orderBy: { publishedAt: "desc" },
			select: { slug: true, updatedAt: true, publishedAt: true },
		}),
	),

	// ── Public detail: by slug; signed-in admin can preview drafts ──
	publicBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const article = await ctx.db.article.findUnique({
				where: { slug: input.slug },
			});
			if (!article) throw new TRPCError({ code: "NOT_FOUND" });
			// Unpublished articles are visible to admins only (draft preview)
			if (article.status !== "published" && !ctx.session?.user) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}
			return {
				...article,
				content: JSON.parse(article.content) as unknown,
				readingTime: readingTimeMinutes(article.plainText),
			};
		}),

	// ── Admin edit load ────────────────────────────────────────
	byId: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const article = await ctx.db.article.findUnique({
				where: { id: input.id },
			});
			if (!article) throw new TRPCError({ code: "NOT_FOUND" });
			return { ...article, content: JSON.parse(article.content) as unknown };
		}),

	create: protectedProcedure
		.input(articleInput)
		.mutation(async ({ ctx, input }) => {
			const slug = await uniqueSlug(ctx.db, input.slug || input.title);
			const publishedAt =
				input.status === "published"
					? (input.publishedAt ?? new Date())
					: (input.publishedAt ?? null);

			return ctx.db.article.create({
				data: {
					title: input.title,
					slug,
					excerpt: input.excerpt,
					...contentFields(input),
					status: input.status,
					publishedAt,
					authorId: ctx.session.user.id,
				},
				select: { id: true },
			});
		}),

	update: protectedProcedure
		.input(articleInput.extend({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.article.findUnique({
				where: { id: input.id },
				select: { publishedAt: true },
			});
			if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

			const slug = await uniqueSlug(ctx.db, input.slug || input.title, input.id);
			const firstPublish = input.status === "published" && !existing.publishedAt;
			const publishedAt =
				input.publishedAt !== undefined
					? input.publishedAt
					: firstPublish
						? new Date()
						: existing.publishedAt;

			return ctx.db.article.update({
				where: { id: input.id },
				data: {
					title: input.title,
					slug,
					excerpt: input.excerpt,
					...contentFields(input),
					status: input.status,
					publishedAt,
				},
				select: { id: true },
			});
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) =>
			ctx.db.article.delete({ where: { id: input.id }, select: { id: true } }),
		),
});
