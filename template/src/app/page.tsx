import Link from "next/link";

import { Button } from "~/components/ui/button";
import { HydrateClient } from "~/trpc/server";

export default function Home() {
	return (
		<HydrateClient>
			<main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4 text-foreground">
				<div className="flex flex-col items-center gap-4 text-center">
					<h1 className="font-bold text-5xl tracking-tight sm:text-6xl">
						my-site
					</h1>
					<p className="max-w-md text-lg text-muted-foreground">
						Built with <span className="font-medium">t3-flare</span> — the T3
						Stack, deployed on Cloudflare.
					</p>
				</div>
				<Button render={<Link href="/admin">前往後台 →</Link>} />
			</main>
		</HydrateClient>
	);
}
