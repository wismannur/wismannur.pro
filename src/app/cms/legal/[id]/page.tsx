"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { lazy, Suspense, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { formatDate } from "@/lib/utils";
import { sitePagesService } from "@/services";
import type { SitePage } from "@/services/site-pages/types";

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
      toast.success('Legal page saved — the public "Last updated" date is now today');
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <span className="ml-3 text-sm font-medium text-slate-300">Loading legal document...</span>
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="max-w-5xl space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06]">
            <Link href="/cms/legal">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{page.title}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-mono text-indigo-400">/{page.slug}</span> — last updated {formatDate(page.updatedAt)}
            </p>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="rounded-xl px-6 h-10 text-xs font-semibold gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving Document...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Legal Page
            </>
          )}
        </Button>
      </div>

      <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
          <CardTitle className="text-base font-bold text-white">Document Settings</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-slate-200 text-xs font-semibold">Document Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 text-xs focus-visible:ring-indigo-500/40"
            />
          </div>
          <div className="flex items-center justify-between rounded-xl bg-[#131726]/70 border border-white/[0.06] p-4.5">
            <div className="space-y-1">
              <Label className="text-sm font-bold text-white">Public Status</Label>
              <div className="text-xs text-slate-400">
                {isPublished
                  ? "This document is publicly accessible on the web"
                  : "Visitors receive a 404 while this page is hidden"}
              </div>
            </div>
            <Switch checked={isPublished} onCheckedChange={setIsPublished} />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
          <CardTitle className="text-base font-bold text-white">Content Body (MDX)</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Suspense fallback={<Skeleton className="h-[500px] w-full rounded-xl bg-white/[0.05]" />}>
            <MDXEditor initialCode={content} onChange={setContent} height="600px" />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
