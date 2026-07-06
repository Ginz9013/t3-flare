import type { Metadata } from "next";

import { ContactForm } from "./_components/ContactForm";

export const metadata: Metadata = {
	title: "Contact",
	description: "Get in touch.",
	alternates: { canonical: "/contact" },
};

export default function ContactPage() {
	return (
		<main className="mx-auto min-h-screen max-w-xl px-6 py-24">
			<header className="mb-10">
				<h1 className="font-semibold text-3xl tracking-tight">Get in touch</h1>
				<p className="mt-3 text-muted-foreground">
					Have a question or a project in mind? Send a message and I'll get back
					to you.
				</p>
			</header>
			<ContactForm />
		</main>
	);
}
