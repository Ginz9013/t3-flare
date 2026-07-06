/**
 * Email templates for the contact form (kept separate from the send logic so
 * copy is easy to tweak). Each builder returns { subject, text, html } for the
 * sendEmail function in ~/server/email.
 */

export type ContactMessage = {
	name: string;
	email: string;
	subject: string;
	message: string;
};

const escapeHtml = (s: string) =>
	s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

/** Outer email shell (light, centered, compatible with most mail clients). */
const layout = (inner: string) => `
	<div style="margin:0;padding:24px;background:#f4f4f5">
		<div style="max-width:560px;margin:0 auto;padding:36px 32px;background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827">
			${inner}
		</div>
	</div>`;

/**
 * "New message" notification email to the site owner.
 * Set replyTo to the visitor's email when sending, so replies go straight to them.
 */
export function notificationEmail(msg: ContactMessage) {
	const safe = {
		name: escapeHtml(msg.name),
		email: escapeHtml(msg.email),
		subject: escapeHtml(msg.subject),
		message: escapeHtml(msg.message).replace(/\n/g, "<br>"),
	};

	const html = layout(`
		<p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af">New contact message</p>
		<p style="margin:0 0 18px;font-size:18px;font-weight:600">${safe.subject}</p>
		<p style="margin:0 0 4px;color:#374151">
			<strong>${safe.name}</strong>
			&lt;<a href="mailto:${safe.email}" style="color:#111827">${safe.email}</a>&gt;
		</p>
		<hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0">
		<p style="margin:0;font-size:15px;line-height:1.7;color:#1f2937">${safe.message}</p>
	`);

	const text = `New contact message\n\nFrom: ${msg.name} <${msg.email}>\nSubject: ${msg.subject}\n\n${msg.message}`;

	return { subject: `[Contact] ${msg.subject}`, text, html };
}
