import { env as clientEnv } from "~/env";

/**
 * Email wrapper (Cloudflare Email Sending binding).
 *
 * - Workers runtime: sends via the `EMAIL` binding (requires completing domain
 *   onboarding in Cloudflare and adding `send_email` to wrangler.jsonc).
 * - Node (next dev / scripts): no binding, logs to the console instead of sending.
 *
 * When there is no binding it degrades to a no-op log, so the contact form works
 * on workers.dev out of the box; email lights up once the binding + a verified
 * domain are configured. Send failures throw and are swallowed by the caller
 * (D1 is the source of truth; a failed notification must not fail the request).
 */

// Minimal type for the Email Sending binding (fallback before wrangler generates SendEmail).
type SendEmailBinding = {
	send(message: {
		to: string | string[];
		from: { email: string; name?: string };
		subject: string;
		html?: string;
		text?: string;
		replyTo?: string;
	}): Promise<{ messageId: string }>;
};

const isWorkers =
	typeof navigator !== "undefined" &&
	navigator.userAgent === "Cloudflare-Workers";

async function getBinding(): Promise<SendEmailBinding | null> {
	if (!isWorkers) return null;
	const { getCloudflareContext } = await import("@opennextjs/cloudflare");
	const { env } = getCloudflareContext();
	return (env as unknown as { EMAIL?: SendEmailBinding }).EMAIL ?? null;
}

export type SendArgs = {
	to: string;
	subject: string;
	html: string;
	text: string;
	replyTo?: string;
};

/** Send one email; on Node dev it only logs and does not actually send. */
export async function sendEmail(args: SendArgs): Promise<void> {
	const binding = await getBinding();

	if (!binding) {
		console.log(
			`[email] (dev/no-binding) to=${args.to} subject="${args.subject}"`,
		);
		return;
	}

	await binding.send({
		to: args.to,
		from: {
			email: clientEnv.CONTACT_FROM_EMAIL ?? "contact@example.com",
			name: "my-site",
		},
		subject: args.subject,
		html: args.html,
		text: args.text,
		replyTo: args.replyTo,
	});
}
