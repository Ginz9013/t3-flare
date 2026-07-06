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
	title: z.string().min(1, "請輸入標題"),
	slug: z.string().min(1, "請輸入英文網址 slug"),
	excerpt: z.string().min(1, "請輸入摘要"),
	content: z.unknown(), // Tiptap ProseMirror JSON document
	status: z.enum(["draft", "published"]).default("draft"),
	// 可選：手動指定發佈時間；未給則首次發佈自動帶入
	publishedAt: z.coerce.date().optional().nullable(),
});

type ArticleInput = z.infer<typeof articleInput>;

/** 產生唯一 slug；衝突時加序號（排除自身） */
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

/** 由 input 算出要寫入 DB 的內文衍生欄位 */
function contentFields(input: ArticleInput) {
	return {
		content: JSON.stringify(input.content ?? {}),
		plainText: extractPlainText(input.content),
	};
}

export const articleRouter = createTRPCRouter({
	// ── 後台列表 ───────────────────────────────────────────────
	list: protectedProcedure.query(({ ctx }) =>
		ctx.db.article.findMany({ orderBy: { updatedAt: "desc" } }),
	),

	// ── 前台公開列表：最新已發佈 ────────────────────────────────
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

	// ── sitemap 用：所有已發佈文章的 slug 與時間 ────────────────
	publishedSlugs: publicProcedure.query(({ ctx }) =>
		ctx.db.article.findMany({
			where: { status: "published" },
			orderBy: { publishedAt: "desc" },
			select: { slug: true, updatedAt: true, publishedAt: true },
		}),
	),

	// ── 前台詳情：依 slug；admin 登入態可預覽草稿 ────────────────
	publicBySlug: publicProcedure
		.input(z.object({ slug: z.string() }))
		.query(async ({ ctx, input }) => {
			const article = await ctx.db.article.findUnique({
				where: { slug: input.slug },
			});
			if (!article) throw new TRPCError({ code: "NOT_FOUND" });
			// 未發佈文章僅 admin 可見（草稿預覽）
			if (article.status !== "published" && !ctx.session?.user) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}
			return {
				...article,
				content: JSON.parse(article.content) as unknown,
				readingTime: readingTimeMinutes(article.plainText),
			};
		}),

	// ── 後台編輯載入 ───────────────────────────────────────────
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
