"use server";

import bcrypt from "bcryptjs";
import { del, put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { getDb, schema } from "@/db";
import { requireAdminUid } from "../core/auth-guard";
import { ServiceError } from "../core/base-service";
import type {
	ChangePasswordInput,
	UserProfile,
	UserProfileUpdate,
	UserSettings,
	UserSettingsUpdate,
} from "./types";

// Server actions backing `userService` (phase 8.5). `getAuthorProfile` is the
// one public read (author-bio on blog/project detail pages); everything else
// is the signed-in admin managing their own profile/settings row.

const { users, userSettings } = schema;

const profileUpdateSchema = z.object({
	displayName: z.string().trim().min(2).max(100),
	bio: z.string().trim().max(500).optional(),
	website: z.string().trim().url().or(z.literal("")).optional(),
	location: z.string().trim().max(100).optional(),
	social: z
		.object({
			github: z.string().trim(),
			twitter: z.string().trim(),
			linkedin: z.string().trim(),
		})
		.optional(),
});

const settingsUpdateSchema = z.object({
	theme: z.enum(["light", "dark", "system"]).optional(),
	colorScheme: z.enum(["blue", "green", "purple", "orange", "red"]).optional(),
	emailNotifications: z.boolean().optional(),
	marketingEmails: z.boolean().optional(),
	newCommentNotifications: z.boolean().optional(),
	mentionNotifications: z.boolean().optional(),
	language: z.string().trim().min(1).max(20).optional(),
	timezone: z.string().trim().min(1).max(50).optional(),
	dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).optional(),
});

const AVATAR_TYPES = ["image/jpeg", "image/png"];
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

const toProfile = (row: typeof users.$inferSelect): UserProfile => ({
	uid: row.uid,
	displayName: row.displayName,
	email: row.email,
	photoURL: row.photoURL,
	bio: row.bio,
	location: row.location,
	website: row.website,
	social: row.social,
});

// Public: the site is single-admin, so "the author" is the (only) admin row.
export async function getAuthorProfile(): Promise<UserProfile | null> {
	const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
	const db = getDb();
	const rows = adminEmail
		? await db.select().from(users).where(eq(users.email, adminEmail)).limit(1)
		: await db.select().from(users).limit(1);
	return rows[0] ? toProfile(rows[0]) : null;
}

export async function getProfile(): Promise<UserProfile | null> {
	const uid = await requireAdminUid();
	const [row] = await getDb().select().from(users).where(eq(users.uid, uid)).limit(1);
	return row ? toProfile(row) : null;
}

export async function updateProfile(data: UserProfileUpdate): Promise<void> {
	const uid = await requireAdminUid();
	const parsed = profileUpdateSchema.safeParse(data);
	if (!parsed.success) {
		throw new ServiceError("Validation failed", "invalid-input", parsed.error);
	}
	// Cast: with `strictNullChecks` off (legacy tsconfig), Zod's inferred object
	// type degrades to all-optional; the schema itself guarantees this shape.
	const clean = parsed.data as UserProfileUpdate;
	await getDb()
		.update(users)
		.set({
			displayName: clean.displayName,
			bio: clean.bio ?? "",
			website: clean.website ?? "",
			location: clean.location ?? "",
			// Social links only change when the form sends them (AuthorBio reads
			// these; the public footer/contact use site_settings.social instead).
			...(clean.social ? { social: clean.social } : {}),
		})
		.where(eq(users.uid, uid));
}

// Uploads the cropped avatar to Vercel Blob and persists the URL. A random
// suffix keeps every upload at a fresh URL (the Blob CDN caches aggressively,
// so overwriting a stable pathname would serve stale images); the previous
// blob is deleted afterwards so the store doesn't accumulate orphans.
export async function updateAvatar(formData: FormData): Promise<string> {
	const uid = await requireAdminUid();
	const file = formData.get("file");
	if (!(file instanceof File) || file.size === 0) {
		throw new ServiceError("No image provided", "invalid-input");
	}
	if (!AVATAR_TYPES.includes(file.type)) {
		throw new ServiceError("Please select a valid image file (JPEG or PNG)", "invalid-input");
	}
	if (file.size > AVATAR_MAX_BYTES) {
		throw new ServiceError("Image size should not exceed 5MB", "invalid-input");
	}

	const db = getDb();
	const [current] = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
	if (!current) {
		throw new ServiceError("Profile not found", "not-found");
	}

	const extension = file.type === "image/png" ? "png" : "jpg";
	const { url } = await put(`profile-images/${uid}.${extension}`, file, {
		access: "public",
		addRandomSuffix: true,
		contentType: file.type,
	});

	await db.update(users).set({ photoURL: url }).where(eq(users.uid, uid));

	const oldUrl = current.photoURL;
	if (oldUrl?.includes(".public.blob.vercel-storage.com/")) {
		await del(oldUrl).catch(() => {
			// Best-effort cleanup — a stale orphan blob is harmless.
		});
	}

	return url;
}

const toSettings = (row: typeof userSettings.$inferSelect): UserSettings => ({
	theme: row.theme,
	colorScheme: row.colorScheme,
	emailNotifications: row.emailNotifications,
	marketingEmails: row.marketingEmails,
	newCommentNotifications: row.newCommentNotifications,
	mentionNotifications: row.mentionNotifications,
	language: row.language,
	timezone: row.timezone,
	dateFormat: row.dateFormat,
	updatedAt: row.updatedAt,
});

export async function getSettings(): Promise<UserSettings | null> {
	const uid = await requireAdminUid();
	const [row] = await getDb()
		.select()
		.from(userSettings)
		.where(eq(userSettings.userId, uid))
		.limit(1);
	return row ? toSettings(row) : null;
}

export async function updateSettings(data: UserSettingsUpdate): Promise<void> {
	const uid = await requireAdminUid();
	const parsed = settingsUpdateSchema.safeParse(data);
	if (!parsed.success) {
		throw new ServiceError("Validation failed", "invalid-input", parsed.error);
	}
	const clean = parsed.data as UserSettingsUpdate;
	if (Object.keys(clean).length === 0) return;
	// Upsert so a missing settings row (fresh database) doesn't silently no-op.
	// `$onUpdate` only fires on plain updates, so stamp updatedAt explicitly.
	await getDb()
		.insert(userSettings)
		.values({ userId: uid, ...clean })
		.onConflictDoUpdate({
			target: userSettings.userId,
			set: { ...clean, updatedAt: new Date() },
		});
}

const changePasswordSchema = z.object({
	currentPassword: z.string().min(1, "Current password is required"),
	newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export async function changePassword(data: ChangePasswordInput): Promise<void> {
	const uid = await requireAdminUid();
	const parsed = changePasswordSchema.safeParse(data);
	if (!parsed.success) {
		throw new ServiceError("Validation failed", "invalid-input", parsed.error);
	}
	const { currentPassword, newPassword } = parsed.data;

	const db = getDb();
	const [user] = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
	if (!user) {
		throw new ServiceError("User not found", "not-found");
	}

	let targetPasswordHash = user.passwordHash;
	if (!targetPasswordHash && process.env.ADMIN_PASSWORD_HASH_B64) {
		targetPasswordHash = Buffer.from(
			process.env.ADMIN_PASSWORD_HASH_B64,
			"base64",
		).toString("utf8");
	}

	if (!targetPasswordHash) {
		throw new ServiceError("No password is currently set", "invalid-input");
	}

	const ok = await bcrypt.compare(currentPassword, targetPasswordHash);
	if (!ok) {
		throw new ServiceError("Current password is incorrect", "invalid-input");
	}

	const newHash = await bcrypt.hash(newPassword, 10);
	await db.update(users).set({ passwordHash: newHash }).where(eq(users.uid, uid));
}

