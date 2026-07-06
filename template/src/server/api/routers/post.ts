import { z } from "zod";

import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";

/**
 * CRUD router for the example content resource. The admin side manages it via protectedProcedure,
 * and the public side reads published content via publicProcedure. Copy and rename the whole thing for your own resource.
 */
export const postRouter = createTRPCRouter({
	// ── Public: published list ──────────────────────────────
	listPublished: publicProcedure.query(async ({ ctx }) => {
		return ctx.db.post.findMany({
			where: { published: true },
			orderBy: { createdAt: "desc" },
		});
	}),

	// ── Admin: full list ────────────────────────────────
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
