import { redirect } from "next/navigation";

import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { getServerSession } from "~/server/better-auth/session";
import { AppSidebar } from "./_components/app-sidebar";

export default async function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await getServerSession();
	if (!session) redirect("/admin/login");

	return (
		<SidebarProvider>
			<AppSidebar
				user={{ name: session.user.name, email: session.user.email }}
			/>
			<SidebarInset>
				<div className="flex flex-1 flex-col gap-4 p-6">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
