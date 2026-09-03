"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { pageCopyService, siteSettingsService } from "@/services";
import type { PageCopyContent, PageKey } from "@/services/page-copy/types";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save, Upload } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Generic structure-preserving editor for a page_copy jsonb blob: it walks
// the stored object and renders an input per string/number/boolean leaf, so
// every page shape (hero blocks, section headers, meta, CTA) is editable
// without one bespoke form per page. Structure (keys, array lengths for
// object arrays) stays fixed — content only.

const LABELS: Record<string, string> = {
  meta: "SEO Meta",
  cta: "CTA Block",
  hero: "Hero",
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
  paragraphs: "Paragraphs",
};

const humanize = (key: string) =>
  LABELS[key] ??
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();

const LONG_TEXT_THRESHOLD = 70;

type Path = Array<string | number>;

const getAt = (obj: unknown, path: Path): unknown =>
  path.reduce((acc: any, key) => (acc == null ? undefined : acc[key]), obj);

const setAt = (obj: any, path: Path, value: unknown): any => {
  if (path.length === 0) return value;
  const [head, ...rest] = path;
  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  clone[head as any] = setAt(obj?.[head as any], rest, value);
  return clone;
};

// Image-url leaves ("photoUrl", …) get an Upload button next to the input —
// the file goes to Vercel Blob via uploadContentImage and the returned URL
// lands in the field.
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
      toast.success("Image uploaded");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-foreground/80 font-medium">{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/placeholder.svg or https://…"
          className="rounded-lg border-border/50"
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
          className="rounded-lg shrink-0"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Upload
            </>
          )}
        </Button>
      </div>
      {value && (
        <img
          src={value}
          alt="Preview"
          className="mt-2 h-24 w-24 rounded-lg object-cover border border-border/50"
        />
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
      <div className="flex items-center justify-between rounded-lg border p-3">
        <Label className="text-foreground/80 font-medium">{label}</Label>
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
    );
  }
  if (typeof value === "number") {
    return (
      <div className="space-y-1.5">
        <Label className="text-foreground/80 font-medium">{label}</Label>
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="rounded-lg border-border/50"
        />
      </div>
    );
  }
  const text = String(value ?? "");
  return (
    <div className="space-y-1.5">
      <Label className="text-foreground/80 font-medium">{label}</Label>
      {text.length > LONG_TEXT_THRESHOLD ? (
        <Textarea
          value={text}
          rows={3}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border-border/50"
        />
      ) : (
        <Input
          value={text}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-lg border-border/50"
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
            <Textarea
              key={index}
              value={item as string}
              rows={3}
              onChange={(e) => onChange([...path, index], e.target.value)}
              className="rounded-lg border-border/50"
            />
          ))}
        </div>
      );
    }
    // Array of objects (cards, pills): fixed-length fieldsets.
    return (
      <div className="space-y-4">
        {value.map((item, index) => (
          <div key={index} className="rounded-lg border border-border/50 p-4 space-y-4">
            <div className="text-sm font-medium text-muted-foreground">#{index + 1}</div>
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
            <div key={key} className="space-y-2">
              <div className="text-sm font-semibold">{humanize(key)}</div>
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
    setContent((current) => (current ? setAt(current, path, value) : current));
  };

  const handleSave = async () => {
    if (!content) return;
    setIsSubmitting(true);
    try {
      await pageCopyService.update(page as PageKey, content);
      queryClient.invalidateQueries({ queryKey: ["cmsPageCopy"] });
      toast.success("Page copy saved — the public page updates immediately");
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
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-2 text-lg">Loading page copy...</span>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="rounded-lg">
            <Link href="/cms/pages">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight capitalize">{page} Copy</h1>
            <p className="text-muted-foreground text-sm">
              Use **text** for the primary-colored accent and __text__ for bold in hero titles and
              paragraphs
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

      {Object.entries(content).map(([sectionKey, sectionValue]) => (
        <Card key={sectionKey} className="border-border/50 shadow-md rounded-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{humanize(sectionKey)}</CardTitle>
            {sectionKey === "meta" && (
              <CardDescription>Browser title and search-result description</CardDescription>
            )}
          </CardHeader>
          <CardContent>
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
