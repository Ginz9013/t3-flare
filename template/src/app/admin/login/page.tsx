"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { authClient } from "~/server/better-auth/client";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setLoading(true);
		const { error } = await authClient.signIn.email({ email, password });
		setLoading(false);
		if (error) {
			toast.error(error.message ?? "Sign in failed");
			return;
		}
		router.push("/admin");
		router.refresh();
	}

	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
			<form
				className="w-full max-w-sm space-y-6 rounded-xl border border-border p-8"
				onSubmit={onSubmit}
			>
				<div className="space-y-1">
					<h1 className="font-semibold text-2xl">Admin Login</h1>
					<p className="text-muted-foreground text-sm">
						Sign in to my-site with your admin account
					</p>
				</div>
				<div className="space-y-2">
					<Label htmlFor="email">Email</Label>
					<Input
						autoComplete="email"
						id="email"
						onChange={(e) => setEmail(e.target.value)}
						required
						type="email"
						value={email}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="password">Password</Label>
					<Input
						autoComplete="current-password"
						id="password"
						onChange={(e) => setPassword(e.target.value)}
						required
						type="password"
						value={password}
					/>
				</div>
				<Button className="w-full" disabled={loading} size="lg" type="submit">
					{loading ? "Signing in…" : "Sign in"}
				</Button>
			</form>
		</main>
	);
}
