import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { env } from "~/env";
import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import type { DB } from "~/server/db";
import { sendEmail } from "~/server/email";
import { notificationEmail } from "~/server/email-templates";

// ── Rate-limit parameters ────────────────────────────────────
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_MAX = 3; // at most 3 submissions per IP per window

const contactInput = z.object({
	name: z.string().trim().min(1, "Please enter your name").max(120),
	email: z.string().trim().email("Please enter a valid email").max(200),
	subject: z.string().trim().min(1, "Please enter a subject").max(200),
	message: z.string().trim().min(1, "Please enter a message").max(5000),
	// Token returned by the Turnstile widget
	token: z.string().optional(),
	// Honeypot: a real person won't fill this; bots often do. Named to look like a real field.
	company: z.string().optional(),
});

/** Server-side Turnstile verification; skipped when no secret is set (dev). */
async function verifyTurnstile(token: string | undefined, ip: string | null) {
	if (!env.TURNSTILE_SECRET_KEY) return; // dev: skip if no key
	if (!token) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Verification missing, please try again.",
		});
	}
	const body = new FormData();
	body.append("secret", env.TURNSTILE_SECRET_KEY);
	body.append("response", token);
	if (ip) body.append("remoteip", ip);

	const res = await fetch(
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		{ method: "POST", body },
	);
	const data = (await res.json()) as { success: boolean };
	if (!data.success) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Verification failed, please refresh and try again.",
		});
	}
}

/** Per-IP rate limit: block once the window count hits the cap. */
async function enforceRateLimit(db: DB, ip: string | null) {
	if (!ip) return;
	const since = new Date(Date.now() - RATE_WINDOW_MS);
	const recent = await db.contact.count({
		where: { ipAddress: ip, createdAt: { gte: since } },
	});
	if (recent >= RATE_MAX) {
		throw new TRPCError({
			code: "TOO_MANY_REQUESTS",
			message: "Too many submissions, please try again later.",
		});
	}
}

export const contactRouter = createTRPCRouter({
	// ── Public submit ─────────────────────────────────────────
	create: publicProcedure
		.input(contactInput)
		.mutation(async ({ ctx, input }) => {
			// Honeypot hit: silently succeed — don't write to DB, don't tip off the bot
			if (input.company && input.company.trim() !== "") {
				return { ok: true };
			}

			const ip = ctx.headers.get("cf-connecting-ip");
			const userAgent = ctx.headers.get("user-agent");

			await verifyTurnstile(input.token, ip);
			await enforceRateLimit(ctx.db, ip);

			// Write to D1 (the single source of truth)
			await ctx.db.contact.create({
				data: {
					name: input.name,
					email: input.email,
					subject: input.subject,
					message: input.message,
					ipAddress: ip,
					userAgent,
				},
				select: { id: true },
			});

			// Notification email to the admin. A send failure must not fail the
			// request — the data is already in D1. Email is a no-op until the
			// Cloudflare Email Sending binding + a verified domain are configured.
			const notifyTo = env.CONTACT_NOTIFY_EMAIL ?? env.ADMIN_EMAIL;
			if (notifyTo) {
				try {
					await sendEmail({
						to: notifyTo,
						replyTo: input.email,
						...notificationEmail({
							name: input.name,
							email: input.email,
							subject: input.subject,
							message: input.message,
						}),
					});
				} catch (err) {
					console.error("[contact] email send failed:", err);
				}
			}

			return { ok: true };
		}),

	// ── Admin list ────────────────────────────────────────────
	list: protectedProcedure
		.input(
			z
				.object({
					status: z.enum(["all", "new", "replied", "archived"]).default("all"),
				})
				.optional(),
		)
		.query(({ ctx, input }) =>
			ctx.db.contact.findMany({
				where:
					input?.status && input.status !== "all"
						? { status: input.status }
						: {},
				orderBy: { createdAt: "desc" },
			}),
		),

	// ── Unread count (sidebar / dashboard) ────────────────────
	unreadCount: protectedProcedure.query(({ ctx }) =>
		ctx.db.contact.count({ where: { isRead: false } }),
	),

	// ── Fetch one and mark as read ────────────────────────────
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const row = await ctx.db.contact.findUnique({ where: { id: input.id } });
			if (!row) throw new TRPCError({ code: "NOT_FOUND" });
			if (!row.isRead) {
				await ctx.db.contact.update({
					where: { id: input.id },
					data: { isRead: true },
				});
			}
			return { ...row, isRead: true };
		}),

	updateStatus: protectedProcedure
		.input(
			z.object({
				id: z.string(),
				status: z.enum(["new", "replied", "archived"]),
			}),
		)
		.mutation(({ ctx, input }) =>
			ctx.db.contact.update({
				where: { id: input.id },
				data: { status: input.status },
				select: { id: true },
			}),
		),

	delete: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) =>
			ctx.db.contact.delete({ where: { id: input.id }, select: { id: true } }),
		),
});
