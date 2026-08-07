"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { pageCopyService } from "@/services";
import type { PageCopyEntry } from "@/services/page-copy/types";
import { useQuery } from "@tanstack/react-query";
import { CalendarCog, FileText, Pencil } from "lucide-react";
import Link from "next/link";

// Human labels + public paths for the page_copy rows.
const PAGE_INFO: Record<string, { label: string; path: string }> = {
	home: { label: "Home", path: "/" },
	about: { label: "About", path: "/about" },
	services: { label: "Services", path: "/services" },
	"hire-me": { label: "Hire Me", path: "/hire-me" },
	offers: { label: "Offers", path: "/offers" },
	blog: { label: "Blog", path: "/blog" },
	projects: { label: "Projects", path: "/projects" },
	contact: { label: "Contact", path: "/contact" },
	"not-found": { label: "404 Page", path: "/" },
	default: { label: "Default CTA", path: "/" },
};

export default function CmsPagesPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["cmsPageCopy"],
		queryFn: () => pageCopyService.getAllForCms(),
	});

	const columns: ColumnDef<PageCopyEntry>[] = [
		{
			header: "Page",
			cell: (entry) => (
				<div className="flex flex-col">
					<div className="font-medium">{PAGE_INFO[entry.page]?.label ?? entry.page}</div>
					<div className="text-sm text-muted-foreground">
						{entry.page === "default" ? "Fallback CTA content" : PAGE_INFO[entry.page]?.path}
					</div>
				</div>
			),
		},
		{
			header: "Sections",
			cell: (entry) => (
				<div className="flex flex-wrap gap-1">
					{Object.keys(entry.content).map((key) => (
						<Badge key={key} variant="outline" className="text-xs">
							{key}
						</Badge>
					))}
				</div>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Updated",
			cell: (entry) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<CalendarCog className="w-4 h-4 mr-1.5" />
					{formatDate(entry.updatedAt)}
				</div>
			),
			className: "hidden lg:table-cell",
		},
		{
			header: "Actions",
			cell: (entry) => (
				<div className="flex justify-end">
					<Button asChild variant="outline" size="sm" className="rounded-lg">
						<Link href={`/cms/pages/${entry.page}`}>
							<Pencil className="h-4 w-4 mr-2" />
							Edit
						</Link>
					</Button>
				</div>
			),
			className: "w-[100px]",
		},
	];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold tracking-tight">Page Copy</h1>
				<p className="text-muted-foreground">
					Edit the hero copy, section headers, SEO meta, and CTA blocks of each public page
				</p>
			</div>

			<DataTable
				columns={columns}
				data={data ?? []}
				isLoading={isLoading}
				keyField="page"
				emptyState={{
					icon: <FileText className="h-8 w-8 mb-2" />,
					title: "No page copy found",
					description: "The page_copy table appears to be empty",
				}}
			/>
		</div>
	);
}
