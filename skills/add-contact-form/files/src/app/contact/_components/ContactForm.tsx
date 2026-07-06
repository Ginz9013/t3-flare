"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { env } from "~/env";
import { api } from "~/trpc/react";

const SITE_KEY = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Minimal type for window.turnstile (injected by the Cloudflare script)
declare global {
	interface Window {
		turnstile?: {
			render: (
				el: HTMLElement,
				opts: {
					sitekey: string;
					callback: (token: string) => void;
					"expired-callback"?: () => void;
					"error-callback"?: () => void;
					theme?: "auto" | "light" | "dark";
					appearance?: "always" | "execute" | "interaction-only";
				},
			) => string;
			reset: (id?: string) => void;
		};
	}
}

const EMPTY = { name: "", email: "", subject: "", message: "", company: "" };

export function ContactForm() {
	const [form, setForm] = useState(EMPTY);
	const [token, setToken] = useState("");
	const widgetRef = useRef<HTMLDivElement>(null);
	const renderedRef = useRef(false);

	// Load and render the Turnstile widget (only when a site key is set)
	useEffect(() => {
		if (!SITE_KEY || renderedRef.current) return;

		const renderWidget = () => {
			if (renderedRef.current || !widgetRef.current || !window.turnstile) return;
			renderedRef.current = true;
			window.turnstile.render(widgetRef.current, {
				sitekey: SITE_KEY,
				appearance: "interaction-only",
				callback: (t) => setToken(t),
				"expired-callback": () => setToken(""),
				"error-callback": () => setToken(""),
			});
		};

		if (window.turnstile) {
			renderWidget();
			return;
		}
		const script = document.createElement("script");
		script.src =
			"https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
		script.async = true;
		script.onload = renderWidget;
		document.head.appendChild(script);
	}, []);

	const set = (key: keyof typeof form, value: string) =>
		setForm((f) => ({ ...f, [key]: value }));

	const create = api.contact.create.useMutation({
		onSuccess: () => {
			toast.success("Message sent — thanks for reaching out!");
			setForm(EMPTY);
			setToken("");
			window.turnstile?.reset();
		},
		onError: (e) => toast.error(e.message || "Something went wrong."),
	});

	const onSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (create.isPending) return;
		if (SITE_KEY && !token) {
			toast.error("Please complete the verification.");
			return;
		}
		create.mutate({
			name: form.name.trim(),
			email: form.email.trim(),
			subject: form.subject.trim(),
			message: form.message.trim(),
			token,
			company: form.company,
		});
	};

	return (
		<form onSubmit={onSubmit} className="space-y-5">
			{/* Honeypot: hidden from humans, bots often fill it */}
			<div className="sr-only" aria-hidden="true">
				<label>
					Company
					<input
						autoComplete="off"
						name="company"
						onChange={(e) => set("company", e.target.value)}
						tabIndex={-1}
						type="text"
						value={form.company}
					/>
				</label>
			</div>

			<div className="grid gap-5 sm:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="name">Name</Label>
					<Input
						id="name"
						autoComplete="name"
						onChange={(e) => set("name", e.target.value)}
						placeholder="Your name"
						required
						value={form.name}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						autoComplete="email"
						onChange={(e) => set("email", e.target.value)}
						placeholder="you@email.com"
						required
						type="email"
						value={form.email}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<Label htmlFor="subject">Subject</Label>
				<Input
					id="subject"
					onChange={(e) => set("subject", e.target.value)}
					placeholder="What is this about?"
					required
					value={form.subject}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="message">Message</Label>
				<Textarea
					id="message"
					onChange={(e) => set("message", e.target.value)}
					placeholder="Whatever you'd like to talk about…"
					required
					rows={5}
					value={form.message}
				/>
			</div>

			{/* Turnstile widget (shown when a site key is set) */}
			{SITE_KEY && <div ref={widgetRef} />}

			<Button disabled={create.isPending} size="lg" type="submit">
				{create.isPending ? "Sending…" : "Send message"}
			</Button>
		</form>
	);
}
