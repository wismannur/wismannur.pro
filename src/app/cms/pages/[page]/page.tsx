"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { pageCopyService, siteSettingsService } from "@/services";
import type { PageCopyContent, PageKey } from "@/services/page-copy/types";

// Generic structure-preserving editor for a page_copy jsonb blob: it walks
// the stored object and renders an input per string/number/boolean leaf, so
// every page shape (hero blocks, section headers, meta, CTA) is editable
// without one bespoke form per page.

const LABELS: Record<string, string> = {
  meta: "SEO Meta",
  cta: "CTA Block",
  hero: "Hero Section",
  sections: "Section Headers",
  header: "Page Header",
  skillsSection: "Skills Section",
  whySection: "Why Work With Me Section",
  whyCards: "Why Work With Me Cards",
  availabilitySection: "Availability Section",
  servicesSection: "Services Section",
  processSection: "Process Section",
  testimonialsSection: "Testimonials Section",
  faqSection: "FAQ Section",
  contactSection: "Contact Form Section",
  requestSection: "Request Form Section",
  statPills: "Stat Pills",
  paragraphs: "Narrative Paragraphs",
};

const humanize = (key: string) =>
  LABELS[key] ??
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const LONG_TEXT_THRESHOLD = 70;

type Path = Array<string | number>;

const setAt = (obj: unknown, path: Path, value: unknown): unknown => {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const clone = [...obj];
    const index = Number(head);
    clone[index] = setAt(clone[index], rest, value);
    return clone;
  }
  if (obj !== null && typeof obj === "object") {
    const clone = { ...(obj as Record<string, unknown>) };
    const key = String(head);
    clone[key] = setAt(clone[key], rest, value);
    return clone;
  }
  return obj;
};

// Image-url leaves ("photoUrl", …) get an Upload button next to the input
function ImageUrlField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (value) formData.append("previousUrl", value);
      const url = await siteSettingsService.uploadContentImage(formData);
      onChange(url);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-slate-200 text-xs font-semibold">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/placeholder.svg or https://…"
          className="h-10 rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/40"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-xl h-10 px-4 text-xs font-semibold border-white/[0.08] bg-[#131726] text-slate-300 hover:text-white hover:bg-white/[0.08] shrink-0"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2 text-indigo-400" />
              Upload
            </>
          )}
        </Button>
      </div>
      {value && (
        <div className="mt-2.5 inline-block rounded-xl p-1 bg-[#131726] border border-white/[0.08]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Preview"
            className="h-24 w-24 rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  );
}

const IMAGE_URL_KEYS = new Set(["photoUrl", "avatarUrl", "imageUrl"]);

function LeafField({
  label,
  value,
  onChange,
  fieldKey,
}: {
  label: string;
  value: unknown;
  onChange: (value: unknown) => void;
  fieldKey?: string;
}) {
  if (typeof value === "string" && fieldKey && IMAGE_URL_KEYS.has(fieldKey)) {
    return <ImageUrlField label={label} value={value} onChange={onChange} />;
  }
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center justify-between rounded-xl bg-[#131726]/70 border border-white/[0.06] p-4">
        <Label className="text-slate-200 text-xs font-semibold">{label}</Label>
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
    );
  }
  if (typeof value === "number") {
    return (
      <div className="space-y-1.5">
        <Label className="text-slate-200 text-xs font-semibold">{label}</Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-10 rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 text-xs focus-visible:ring-indigo-500/40"
        />
      </div>
    );
  }
  const text = String(value ?? "");
  return (
    <div className="space-y-1.5">
      <Label className="text-slate-200 text-xs font-semibold">{label}</Label>
      {text.length > LONG_TEXT_THRESHOLD ? (
        <Textarea
          value={text}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs leading-relaxed focus-visible:ring-indigo-500/40"
        />
      ) : (
        <Input
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 placeholder:text-slate-500 text-xs focus-visible:ring-indigo-500/40"
        />
      )}
    </div>
  );
}

function Node({
  value,
  path,
  onChange,
}: {
  value: unknown;
  path: Path;
  onChange: (path: Path, value: unknown) => void;
}) {
  if (Array.isArray(value)) {
    // Array of strings (e.g. bio paragraphs): one textarea per entry.
    if (value.every((item) => typeof item === "string")) {
      return (
        <div className="space-y-3">
          {value.map((item, index) => (
            <div key={index} className="space-y-1">
              <span className="text-[11px] font-mono text-indigo-400">Paragraph #{index + 1}</span>
              <Textarea
                value={item as string}
                rows={3}
                onChange={(e) => onChange([...path, index], e.target.value)}
                className="rounded-xl bg-[#131726]/80 border-white/[0.08] text-slate-100 text-xs leading-relaxed focus-visible:ring-indigo-500/40"
              />
            </div>
          ))}
        </div>
      );
    }
    // Array of objects (cards, pills): fixed-length fieldsets.
    return (
      <div className="space-y-4">
        {value.map((item, index) => (
          <div key={index} className="rounded-xl bg-[#131726]/60 border border-white/[0.06] p-4.5 space-y-4">
            <div className="text-xs font-bold text-indigo-400 font-mono">Item #{index + 1}</div>
            <Node value={item} path={[...path, index]} onChange={onChange} />
          </div>
        ))}
      </div>
    );
  }
  if (value !== null && typeof value === "object") {
    return (
      <div className="space-y-4">
        {Object.entries(value).map(([key, child]) => {
          const isNested = child !== null && typeof child === "object";
          return isNested ? (
            <div key={key} className="space-y-2 pt-2 first:pt-0">
              <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">{humanize(key)}</div>
              <Node value={child} path={[...path, key]} onChange={onChange} />
            </div>
          ) : (
            <LeafField
              key={key}
              fieldKey={key}
              label={humanize(key)}
              value={child}
              onChange={(next) => onChange([...path, key], next)}
            />
          );
        })}
      </div>
    );
  }
  return null;
}

export default function CmsPageCopyEditor() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { page } = useParams<{ page: string }>();
  const [content, setContent] = useState<PageCopyContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await pageCopyService.get(page as PageKey);
        if (data) {
          setContent(data);
        } else {
          toast.error("Page copy not found");
          router.push("/cms/pages");
        }
      } catch (error) {
        console.error("Error loading page copy:", error);
        toast.error("Failed to load page copy");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [page, router]);

  const handleChange = (path: Path, value: unknown) => {
    setContent((current) => (current ? (setAt(current, path, value) as PageCopyContent) : current));
  };

  const handleSave = async () => {
    if (!content) return;
    setIsSubmitting(true);
    try {
      await pageCopyService.update(page as PageKey, content);
      queryClient.invalidateQueries({ queryKey: ["cmsPageCopy"] });
      toast.success("Page copy saved — public page updates immediately");
    } catch (error) {
      console.error("Error saving page copy:", error);
      toast.error("Failed to save page copy");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <span className="ml-3 text-sm font-medium text-slate-300">Loading page copy...</span>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06]">
            <Link href="/cms/pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white capitalize">{page} Copy</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Use <code className="text-indigo-400 bg-indigo-500/10 px-1 py-0.5 rounded font-mono">**text**</code> for primary accent color and <code className="text-slate-200 bg-white/[0.06] px-1 py-0.5 rounded font-mono">__text__</code> for bold in titles and bio text.
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
              Saving Copy...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save Page Copy
            </>
          )}
        </Button>
      </div>

      {Object.entries(content).map(([sectionKey, sectionValue]) => (
        <Card key={sectionKey} className="border border-white/[0.08] bg-[#0C0E18]/80 backdrop-blur-xl shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="p-6 pb-4 border-b border-white/[0.06]">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />
              {humanize(sectionKey)}
            </CardTitle>
            {sectionKey === "meta" && (
              <CardDescription className="text-xs text-slate-400">
                Browser title and search engine metadata snippet.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="p-6">
            {typeof sectionValue === "object" && sectionValue !== null ? (
              <Node value={sectionValue} path={[sectionKey]} onChange={handleChange} />
            ) : (
              <LeafField
                label={humanize(sectionKey)}
                value={sectionValue}
                onChange={(next) => handleChange([sectionKey], next)}
              />
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
