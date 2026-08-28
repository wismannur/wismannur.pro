"use client";

import dynamic from "next/dynamic";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getContentIcon } from "@/lib/icon-registry";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Same client-side unified pipeline as blog/project detail pages.
const MDXPreview = dynamic(() => import("@/components/mdx/mdx-preview"), {
	ssr: false,
	loading: () => (
		<div className="space-y-4">
			<Skeleton className="h-6 w-1/3" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-5/6" />
			<Skeleton className="h-4 w-2/3" />
		</div>
	),
});

type SitePageViewProps = {
	title: string;
	// Pre-formatted on the server ("April 8, 2024") so client/server locales
	// can't disagree.
	lastUpdatedLabel: string;
	content: string;
	icon: string;
};

// Shell for the CMS-managed MDX pages (/privacy-policy, /terms-of-service).
export function SitePageView({ title, lastUpdatedLabel, content, icon }: SitePageViewProps) {
	const Icon = getContentIcon(icon);

	return (
		<div className="container max-w-4xl mx-auto py-16 px-4">
			<div className="flex items-center gap-2 mb-8">
				<Button variant="ghost" size="sm" asChild className="rounded-full">
					<Link href="/" data-umami-event="legal-back-home-click" className="flex items-center gap-2">
						<ArrowLeft size={16} />
						Back to Home
					</Link>
				</Button>
			</div>

			<div className="bg-background border border-border/40 rounded-xl p-8 shadow-md">
				<div className="flex items-center gap-3 mb-6">
					<div className="p-3 bg-primary/10 rounded-xl text-primary">
						<Icon size={24} />
					</div>
					<h1 className="text-3xl font-bold">{title}</h1>
				</div>

				<div className="prose prose-lg max-w-none">
					<p className="text-muted-foreground">Last updated: {lastUpdatedLabel}</p>
					<MDXPreview code={content} />
				</div>
			</div>
		</div>
	);
}
