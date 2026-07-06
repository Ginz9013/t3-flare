"use client";

import { FileText, ImageIcon, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Button } from "~/components/ui/button";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import { authClient } from "~/server/better-auth/client";

const navItems = [
	{ title: "Overview", href: "/admin", icon: LayoutDashboard },
	{ title: "Posts", href: "/admin/posts", icon: FileText },
	// [module:r2] Media management — delete this item when removing the R2 module
	{ title: "Media", href: "/admin/media", icon: ImageIcon },
];

export function AppSidebar({
	user,
}: {
	user: { name: string; email: string };
}) {
	const pathname = usePathname();
	const router = useRouter();

	async function signOut() {
		await authClient.signOut();
		router.push("/admin/login");
		router.refresh();
	}

	return (
		<Sidebar>
			<SidebarHeader className="p-4">
				<span className="font-semibold text-lg">my-site</span>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Manage</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{navItems.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										isActive={
											item.href === "/admin"
												? pathname === "/admin"
												: pathname.startsWith(item.href)
										}
										render={<Link href={item.href} />}
									>
										<item.icon />
										<span>{item.title}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter className="gap-2 p-4">
				<div className="text-muted-foreground text-xs">
					<div className="truncate font-medium text-foreground">
						{user.name}
					</div>
					<div className="truncate">{user.email}</div>
				</div>
				<Button onClick={signOut} size="sm" variant="outline">
					<LogOut />
					<span>Sign out</span>
				</Button>
			</SidebarFooter>
		</Sidebar>
	);
}
