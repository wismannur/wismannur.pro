"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";
import { sitePagesService } from "@/services";
import type { SitePage } from "@/services/site-pages/types";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { lazy, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

// Same lazy-loaded editor as the blog form (textarea + live MDX preview).
const MDXEditor = lazy(() => import("@/components/mdx/mdx-editor"));

export default function CmsLegalEditorPage() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { id } = useParams<{ id: string }>();

	const [page, setPage] = useState<SitePage | null>(null);
	const [title, setTitle] = useState("");
	const [content, setContent] = useState("");
	const [isPublished, setIsPublished] = useState(true);
	const [isLoading, setIsLoading] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const load = async () => {
			try {
				const data = await sitePagesService.getById(id);
				if (data) {
					setPage(data);
					setTitle(data.title);
					setContent(data.content);
					setIsPublished(data.isPublished);
				} else {
					toast.error("Page not found");
					router.push("/cms/legal");
				}
			} catch (error) {
				console.error("Error loading page:", error);
				toast.error("Failed to load page");
			} finally {
				setIsLoading(false);
			}
		};
		load();
	}, [id, router]);

	const handleSave = async () => {
		if (!title.trim()) {
			toast.error("Title is required");
			return;
		}
		setIsSubmitting(true);
		try {
			await sitePagesService.update(id, {
				title: title.trim(),
				content,
				isPublished,
			});
			queryClient.invalidateQueries({ queryKey: ["cmsSitePages"] });
			toast.success('Page saved — the public "Last updated" date is now today');
			router.push("/cms/legal");
		} catch (error) {
			console.error("Error saving page:", error);
			toast.error("Failed to save page");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-96">
				<Loader2 className="h-10 w-10 animate-spin text-primary" />
				<span className="ml-2 text-lg">Loading page...</span>
			</div>
		);
	}

	if (!page) return null;

	return (
		<div className="max-w-5xl space-y-6">
			<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<Button asChild variant="ghost" size="icon" className="rounded-lg">
						<Link href="/cms/legal">
							<ArrowLeft className="h-4 w-4" />
						</Link>
					</Button>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">{page.title}</h1>
						<p className="text-muted-foreground text-sm">
							/{page.slug} — last updated {formatDate(page.updatedAt)}
						</p>
					</div>
				</div>
				<Button onClick={handleSave} disabled={isSubmitting} className="rounded-lg">
					{isSubmitting ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Saving...
						</>
					) : (
						<>
							<Save className="mr-2 h-4 w-4" />
							Save
						</>
					)}
				</Button>
			</div>

			<Card className="border-border/50 shadow-md rounded-xl">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg">Page Settings</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-1.5">
						<Label className="text-foreground/80 font-medium">Title</Label>
						<Input
							value={title}
							onChange={(e) => setTitle(e.target.value)}
							className="rounded-lg border-border/50"
						/>
					</div>
					<div className="flex items-center justify-between rounded-lg border p-4">
						<div className="space-y-0.5">
							<Label className="text-base">Publication Status</Label>
							<div className="text-sm text-muted-foreground">
								{isPublished
									? "This page is publicly accessible"
									: "Visitors get a 404 while this page is hidden"}
							</div>
						</div>
						<Switch checked={isPublished} onCheckedChange={setIsPublished} />
					</div>
				</CardContent>
			</Card>

			<Card className="border-border/50 shadow-md rounded-xl">
				<CardHeader className="pb-3">
					<CardTitle className="text-lg">Content (MDX)</CardTitle>
				</CardHeader>
				<CardContent>
					<Suspense fallback={<Skeleton className="h-[500px] w-full rounded-lg" />}>
						<MDXEditor initialCode={content} onChange={setContent} height="600px" />
					</Suspense>
				</CardContent>
			</Card>
		</div>
	);
}
