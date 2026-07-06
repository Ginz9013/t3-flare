import { ContactsTable } from "./_components/ContactsTable";

export const metadata = { title: "Contact messages" };

export default function AdminContactsPage() {
	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-semibold text-2xl">Contact messages</h1>
				<p className="text-muted-foreground text-sm">
					Submissions from the public contact form.
				</p>
			</div>
			<ContactsTable />
		</div>
	);
}
