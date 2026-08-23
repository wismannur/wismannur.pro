"use server";

import { revalidatePath } from "next/cache";

import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import { ServiceError } from "../core/base-service";
import { DEFAULT_SITE_SETTINGS } from "./defaults";
import type { SiteSettings, SiteSettingsUpdate } from "./types";

// Server actions backing `siteSettingsService` — the singleton row feeding
// root-layout metadata, footer/navbar, contact page, and the request-form
// dropdowns. Reads are public (server components on every page); the update
// is admin-only.

const { siteSettings } = schema;

const SITE_SETTINGS_ID = "site";

const labeledLinkSchema = z.object({ label: z.string(), href: z.string() });
const selectOptionSchema = z.object({ id: z.string(), label: z.string() });

const settingsUpdateSchema = z.object({
	siteName: z.string().trim().min(1).optional(),
	titleDefault: z.string().trim().min(1).optional(),
	titleTemplate: z.string().trim().min(1).optional(),
	metaDescription: z.string().trim().optional(),
	keywords: z.array(z.string().trim()).optional(),
	twitterHandle: z.string().trim().optional(),
	themeColor: z.string().trim().optional(),
	ogTitle: z.string().trim().optional(),
	ogTagline: z.string().trim().optional(),
	publicEmail: z.string().trim().email().or(z.literal("")).optional(),
	location: z.string().trim().optional(),
	timezoneLabel: z.string().trim().optional(),
	social: z
		.object({ github: z.string(), twitter: z.string(), linkedin: z.string() })
		.optional(),
	footerBio: z.string().trim().optional(),
	footerTagline: z.string().trim().optional(),
	copyrightName: z.string().trim().optional(),
	repoUrl: z.string().trim().optional(),
	repoLinkLabel: z.string().trim().optional(),
	footerProjectLinks: z.array(labeledLinkSchema).optional(),
	requestTimeframes: z.array(selectOptionSchema).optional(),
	requestBudgetRanges: z.array(selectOptionSchema).optional(),
	enableBlog: z.boolean().optional(),
});

export async function getSiteSettings(): Promise<SiteSettings> {
	try {
		const [row] = await getDb()
			.select()
			.from(siteSettings)
			.where(eq(siteSettings.id, SITE_SETTINGS_ID))
			.limit(1);
		if (!row) return DEFAULT_SITE_SETTINGS;
		const { id: _id, ...rest } = row;
		return rest;
	} catch {
		return DEFAULT_SITE_SETTINGS;
	}
}

export async function updateSiteSettings(data: SiteSettingsUpdate): Promise<void> {
	await assertAdmin();
	const parsed = settingsUpdateSchema.safeParse(data);
	if (!parsed.success) {
		throw new ServiceError("Validation failed", "invalid-input", parsed.error);
	}
	// Cast: with `strictNullChecks` off (legacy tsconfig), Zod's inferred object
	// type degrades to all-optional; the schema itself guarantees this shape.
	const clean = parsed.data as SiteSettingsUpdate;
	if (Object.keys(clean).length === 0) return;
	// Upsert like user_settings; `$onUpdate` doesn't fire on upsert, so stamp
	// updatedAt explicitly. The insert branch (fresh DB safety net) needs the
	// full row, so the defaults backfill whatever the partial doesn't carry.
	const { updatedAt: _defaultUpdatedAt, ...defaults } = DEFAULT_SITE_SETTINGS;
	await getDb()
		.insert(siteSettings)
		.values({ id: SITE_SETTINGS_ID, ...defaults, ...clean })
		.onConflictDoUpdate({
			target: siteSettings.id,
			set: { ...clean, updatedAt: new Date() },
		});
	// Footer/navbar/metadata are layout-level, so everything is affected.
	revalidatePath("/", "layout");
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const IMAGE_MAX_BYTES = 5 * 1024 * 1024;

// Generic content-image upload (about photo, testimonial avatars, …) — the
// same Blob strategy as the avatar: random suffix for cache-busting, and the
// optional previous blob deleted best-effort so the store stays clean.
export async function uploadContentImage(formData: FormData): Promise<string> {
	await assertAdmin();
	const file = formData.get("file");
	if (!(file instanceof File) || file.size === 0) {
		throw new ServiceError("No image provided", "invalid-input");
	}
	if (!IMAGE_TYPES.includes(file.type)) {
		throw new ServiceError("Please select a valid image file (JPEG, PNG, or WebP)", "invalid-input");
	}
	if (file.size > IMAGE_MAX_BYTES) {
		throw new ServiceError("Image size should not exceed 5MB", "invalid-input");
	}

	const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
	const { url } = await put(`content-images/upload.${extension}`, file, {
		access: "public",
		addRandomSuffix: true,
		contentType: file.type,
	});

	const previousUrl = formData.get("previousUrl");
	if (
		typeof previousUrl === "string" &&
		previousUrl.includes(".public.blob.vercel-storage.com/")
	) {
		await del(previousUrl).catch(() => {
			// Best-effort cleanup — a stale orphan blob is harmless.
		});
	}

	return url;
}
