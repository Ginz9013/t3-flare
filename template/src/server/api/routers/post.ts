import { z } from "zod";

import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

/**
 * 範例內容資源的 CRUD router。後台以 protectedProcedure 管理，
 * 前台以 publicProcedure 讀取已發佈內容。可整份複製改名成你的資源。
 */
export const postRouter = createTRPCRouter({
	// ── 前台：已發佈列表 ──────────────────────────────
	listPublished: publicProcedure.query(async ({ ctx }) => {
		return ctx.db.post.findMany({
			where: { published: true },
			orderBy: { createdAt: "desc" },
		});
	}),

	// ── 後台：全部列表 ────────────────────────────────
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.post.findMany({ orderBy: { createdAt: "desc" } });
	}),

	byId: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.post.findUnique({ where: { id: input.id } });
		}),

	create: protectedProcedure
		.input(
			z.object({
				title: z.string().min(1),
				content: z.string().optional(),
				published: z.boolean().default(false),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.post.create({
				data: {
					title: input.title,
					content: input.content,
					published: input.published,
					createdBy: { connect: { id: ctx.session.user.id } },
				},
			});
		}),

	update: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				title: z.string().min(1),
				content: z.string().optional(),
				published: z.boolean(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.post.update({
				where: { id: input.id },
				data: {
					title: input.title,
					content: input.content,
					published: input.published,
				},
			});
		}),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			return ctx.db.post.delete({ where: { id: input.id } });
		}),
});
