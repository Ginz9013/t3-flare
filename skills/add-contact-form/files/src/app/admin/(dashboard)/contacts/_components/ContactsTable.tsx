"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "~/components/ui/sheet";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import type { RouterOutputs } from "~/trpc/react";
import { api } from "~/trpc/react";

type Contact = RouterOutputs["contact"]["list"][number];

const STATUS_LABEL: Record<string, string> = {
	new: "New",
	replied: "Replied",
	archived: "Archived",
};

function fmtDateTime(d: Date) {
	return new Date(d).toLocaleString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function ContactsTable() {
	const utils = api.useUtils();
	const [filter, setFilter] = useState<"all" | "new" | "replied" | "archived">(
		"all",
	);
	const [open, setOpen] = useState(false);
	const [selected, setSelected] = useState<Contact | null>(null);

	const list = api.contact.list.useQuery({ status: filter });

	const markRead = api.contact.getById.useMutation({
		onSuccess: async () => {
			await utils.contact.list.invalidate();
			await utils.contact.unreadCount.invalidate();
		},
	});

	const updateStatus = api.contact.updateStatus.useMutation({
		onSuccess: async () => {
			toast.success("Status updated");
			await utils.contact.list.invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	const del = api.contact.delete.useMutation({
		onSuccess: async () => {
			toast.success("Message deleted");
			setOpen(false);
			await utils.contact.list.invalidate();
			await utils.contact.unreadCount.invalidate();
		},
		onError: (e) => toast.error(e.message),
	});

	const openDetail = (row: Contact) => {
		setSelected(row);
		setOpen(true);
		if (!row.isRead) markRead.mutate({ id: row.id });
	};

	const onDelete = (id: string, name: string) => {
		if (!window.confirm(`Delete the message from "${name}"? This cannot be undone.`))
			return;
		del.mutate({ id });
	};

	const rows = list.data ?? [];

	return (
		<>
			<div className="mb-4 flex items-center justify-between gap-4">
				<Select
					onValueChange={(v) => setFilter((v as typeof filter | null) ?? "all")}
					value={filter}
				>
					<SelectTrigger className="w-40">
						<SelectValue placeholder="Filter" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="new">New</SelectItem>
						<SelectItem value="replied">Replied</SelectItem>
						<SelectItem value="archived">Archived</SelectItem>
					</SelectContent>
				</Select>
			</div>

			<div className="rounded-2xl border border-border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>From</TableHead>
							<TableHead>Subject</TableHead>
							<TableHead className="w-24">Status</TableHead>
							<TableHead className="font-mono">Date</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{list.isLoading && (
							<TableRow>
								<TableCell
									className="py-16 text-center text-muted-foreground text-sm"
									colSpan={5}
								>
									Loading…
								</TableCell>
							</TableRow>
						)}
						{!list.isLoading && rows.length === 0 && (
							<TableRow>
								<TableCell
									className="py-16 text-center text-muted-foreground text-sm"
									colSpan={5}
								>
									No messages yet.
								</TableCell>
							</TableRow>
						)}
						{rows.map((row) => (
							<TableRow key={row.id}>
								<TableCell>
									<button
										className="text-left font-medium hover:underline"
										onClick={() => openDetail(row)}
										type="button"
									>
										{!row.isRead && (
											<span className="mr-2 inline-block size-2 rounded-full bg-sky-500 align-middle">
												<span className="sr-only">Unread</span>
											</span>
										)}
										{row.name}
									</button>
									<div className="text-muted-foreground text-xs">{row.email}</div>
								</TableCell>
								<TableCell className="max-w-[22ch] truncate text-muted-foreground">
									{row.subject}
								</TableCell>
								<TableCell>
									<Badge
										className="rounded-full"
										variant={row.status === "new" ? "default" : "secondary"}
									>
										{STATUS_LABEL[row.status] ?? row.status}
									</Badge>
								</TableCell>
								<TableCell className="font-mono text-muted-foreground text-xs">
									{fmtDateTime(row.createdAt)}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											onClick={() => openDetail(row)}
											size="sm"
											variant="ghost"
										>
											View
										</Button>
										<Button
											className="text-destructive hover:text-destructive"
											disabled={del.isPending}
											onClick={() => onDelete(row.id, row.name)}
											size="sm"
											variant="ghost"
										>
											Delete
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			<Sheet onOpenChange={setOpen} open={open}>
				<SheetContent className="w-full gap-0 sm:max-w-md">
					{selected && (
						<>
							<SheetHeader className="border-border border-b">
								<SheetTitle>{selected.subject}</SheetTitle>
								<SheetDescription>
									{selected.name} &lt;{selected.email}&gt;
								</SheetDescription>
							</SheetHeader>

							<div className="flex-1 overflow-y-auto p-4">
								<p className="whitespace-pre-wrap text-foreground text-sm leading-relaxed">
									{selected.message}
								</p>

								<dl className="mt-8 space-y-2 text-muted-foreground text-xs">
									<div className="flex justify-between gap-4">
										<dt>Date</dt>
										<dd className="font-mono">{fmtDateTime(selected.createdAt)}</dd>
									</div>
									{selected.ipAddress && (
										<div className="flex justify-between gap-4">
											<dt>IP</dt>
											<dd className="font-mono">{selected.ipAddress}</dd>
										</div>
									)}
								</dl>
							</div>

							<div className="flex items-center gap-3 border-border border-t p-4">
								<Select
									onValueChange={(v) => {
										const status =
											(v as "new" | "replied" | "archived" | null) ?? "new";
										setSelected({ ...selected, status });
										updateStatus.mutate({ id: selected.id, status });
									}}
									value={selected.status}
								>
									<SelectTrigger className="flex-1">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="new">New</SelectItem>
										<SelectItem value="replied">Replied</SelectItem>
										<SelectItem value="archived">Archived</SelectItem>
									</SelectContent>
								</Select>
								<Button
									onClick={() => {
										window.location.href = `mailto:${selected.email}?subject=${encodeURIComponent(
											`Re: ${selected.subject}`,
										)}`;
									}}
									size="sm"
								>
									Reply
								</Button>
							</div>
						</>
					)}
				</SheetContent>
			</Sheet>
		</>
	);
}
