"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { formatDate } from "@/lib/utils";
import { sitePagesService } from "@/services";
import type { SitePage } from "@/services/site-pages/types";
import { useQuery } from "@tanstack/react-query";
import { CalendarCog, Pencil, Scale } from "lucide-react";
import Link from "next/link";

export default function CmsLegalPage() {
	const { data, isLoading } = useQuery({
		queryKey: ["cmsSitePages"],
		queryFn: () => sitePagesService.getAllForCms(),
	});

	const columns: ColumnDef<SitePage>[] = [
		{
			header: "Page",
			cell: (page) => (
				<div className="flex flex-col">
					<div className="font-medium">{page.title}</div>
					<div className="text-sm text-muted-foreground">/{page.slug}</div>
				</div>
			),
		},
		{
			header: "Status",
			cell: (page) => (
				<Badge variant={page.isPublished ? "default" : "secondary"}>
					{page.isPublished ? "Published" : "Hidden"}
				</Badge>
			),
			className: "hidden md:table-cell",
		},
		{
			header: "Last Updated",
			cell: (page) => (
				<div className="flex items-center text-muted-foreground text-sm">
					<CalendarCog className="w-4 h-4 mr-1.5" />
					{formatDate(page.updatedAt)}
				</div>
			),
			className: "hidden lg:table-cell",
		},
		{
			header: "Actions",
			cell: (page) => (
				<div className="flex justify-end">
					<Button asChild variant="outline" size="sm" className="rounded-lg">
						<Link href={`/cms/legal/${page.id}`}>
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
				<h1 className="text-2xl font-bold tracking-tight">Legal Pages</h1>
				<p className="text-muted-foreground">
					Privacy policy and terms of service, written in MDX — saving updates the public "Last
					updated" date
				</p>
			</div>

			<DataTable
				columns={columns}
				data={data ?? []}
				isLoading={isLoading}
				keyField="id"
				emptyState={{
					icon: <Scale className="h-8 w-8 mb-2" />,
					title: "No legal pages found",
					description: "The site_pages table appears to be empty",
				}}
			/>
		</div>
	);
}
