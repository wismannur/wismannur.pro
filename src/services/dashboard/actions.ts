"use server";

import { desc, eq, sql } from "drizzle-orm";

import { getDb, schema } from "@/db";
import { countRows } from "@/db/sort";
import { assertAdmin } from "../core/auth-guard";
import type {
	DashboardAlert,
	DashboardSummary,
	DraftEntry,
	InboxEntry,
	TopContentEntry,
} from "./types";

// Server action backing `dashboardService` — one aggregate read for
// /cms/dashboard. Counts run as SQL count(*)/sum() instead of pulling whole
// tables into the browser (the old dashboard did, and its contact counts were
// silently capped at one pagination page).

const { availabilitySlots, blogs, contacts, projects, serviceRequests, hireRequests, sitePages } = schema;

const INBOX_LIMIT = 6;
const DRAFTS_LIMIT = 6;
const TOP_CONTENT_LIMIT = 5;
const LEGAL_STALE_MS = 365 * 24 * 60 * 60 * 1000;

export async function getSummary(): Promise<DashboardSummary> {
	await assertAdmin();
	const db = getDb();

	const [
		[blogStats],
		[projectStats],
		[contactStats],
		[requestStats],
		[hireStats],
		recentContacts,
		recentRequests,
		recentHires,
		blogDrafts,
		projectDrafts,
		topBlogs,
		topProjects,
		slots,
		legalPages,
	] = await Promise.all([
		db
			.select({
				total: countRows,
				published: sql<number>`count(*) filter (where ${blogs.isPublished})::int`,
				views: sql<number>`coalesce(sum(${blogs.views}), 0)::int`,
			})
			.from(blogs),
		db
			.select({
				total: countRows,
				published: sql<number>`count(*) filter (where ${projects.isPublished})::int`,
				views: sql<number>`coalesce(sum(${projects.views}), 0)::int`,
			})
			.from(projects),
		db
			.select({
				total: countRows,
				unread: sql<number>`count(*) filter (where ${contacts.status} = 'new')::int`,
			})
			.from(contacts),
		db
			.select({
				total: countRows,
				pending: sql<number>`count(*) filter (where ${serviceRequests.status} = 'new')::int`,
			})
			.from(serviceRequests),
		db
			.select({
				total: countRows,
				pending: sql<number>`count(*) filter (where ${hireRequests.status} = 'new')::int`,
			})
			.from(hireRequests),
		db
			.select({
				id: contacts.id,
				name: contacts.name,
				subject: contacts.subject,
				status: contacts.status,
				createdAt: contacts.createdAt,
			})
			.from(contacts)
			.orderBy(desc(contacts.createdAt))
			.limit(INBOX_LIMIT),
		db
			.select({
				id: serviceRequests.id,
				name: serviceRequests.name,
				subject: serviceRequests.serviceType,
				status: serviceRequests.status,
				createdAt: serviceRequests.createdAt,
			})
			.from(serviceRequests)
			.orderBy(desc(serviceRequests.createdAt))
			.limit(INBOX_LIMIT),
		db
			.select({
				id: hireRequests.id,
				name: hireRequests.name,
				subject: sql<string>`${hireRequests.roleTitle} || ' @ ' || ${hireRequests.company}`,
				status: hireRequests.status,
				createdAt: hireRequests.createdAt,
			})
			.from(hireRequests)
			.orderBy(desc(hireRequests.createdAt))
			.limit(INBOX_LIMIT),
		db
			.select({ id: blogs.id, title: blogs.title, updatedAt: blogs.updatedAt })
			.from(blogs)
			.where(eq(blogs.isPublished, false))
			.orderBy(desc(blogs.updatedAt))
			.limit(DRAFTS_LIMIT),
		db
			.select({ id: projects.id, title: projects.title, updatedAt: projects.updatedAt })
			.from(projects)
			.where(eq(projects.isPublished, false))
			.orderBy(desc(projects.updatedAt))
			.limit(DRAFTS_LIMIT),
		db
			.select({
				id: blogs.id,
				title: blogs.title,
				slug: blogs.slug,
				views: blogs.views,
				likes: blogs.likes,
			})
			.from(blogs)
			.where(eq(blogs.isPublished, true))
			.orderBy(desc(blogs.views))
			.limit(TOP_CONTENT_LIMIT),
		db
			.select({
				id: projects.id,
				title: projects.title,
				slug: projects.slug,
				views: projects.views,
				likes: projects.likes,
			})
			.from(projects)
			.where(eq(projects.isPublished, true))
			.orderBy(desc(projects.views))
			.limit(TOP_CONTENT_LIMIT),
		db
			.select({ month: availabilitySlots.month, year: availabilitySlots.year })
			.from(availabilitySlots)
			.where(eq(availabilitySlots.isPublished, true)),
		db
			.select({ slug: sitePages.slug, title: sitePages.title, updatedAt: sitePages.updatedAt })
			.from(sitePages),
	]);

	const inbox: InboxEntry[] = [
		...recentContacts.map((row) => ({ ...row, kind: "contact" as const })),
		...recentRequests.map((row) => ({ ...row, kind: "service-request" as const })),
		...recentHires.map((row) => ({ ...row, kind: "hire-request" as const })),
	]
		.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
		.slice(0, INBOX_LIMIT);

	const drafts: DraftEntry[] = [
		...blogDrafts.map((row) => ({ ...row, kind: "blog" as const })),
		...projectDrafts.map((row) => ({ ...row, kind: "project" as const })),
	]
		.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
		.slice(0, DRAFTS_LIMIT);

	const topContent: TopContentEntry[] = [
		...topBlogs.map((row) => ({ ...row, kind: "blog" as const })),
		...topProjects.map((row) => ({ ...row, kind: "project" as const })),
	]
		.sort((a, b) => b.views - a.views)
		.slice(0, TOP_CONTENT_LIMIT);

	// Content-freshness alerts — the exact stale-data traps this site has hit
	// before (2025 availability slots, 2024 legal pages).
	const alerts: DashboardAlert[] = [];
	const now = new Date();
	const currentIndex = now.getFullYear() * 12 + now.getMonth();
	const latestSlotIndex = slots.length
		? Math.max(...slots.map((slot) => slot.year * 12 + (slot.month - 1)))
		: null;

	if (latestSlotIndex === null) {
		alerts.push({
			id: "availability-empty",
			severity: "warning",
			message: "No availability slots are published — /hire-me shows an empty availability grid",
			href: "/cms/availability",
		});
	} else if (latestSlotIndex < currentIndex) {
		alerts.push({
			id: "availability-stale",
			severity: "warning",
			message: "All availability slots on /hire-me are in the past — add upcoming months",
			href: "/cms/availability",
		});
	} else if (latestSlotIndex === currentIndex) {
		alerts.push({
			id: "availability-ending",
			severity: "info",
			message: "Your last availability slot ends this month — consider adding more months",
			href: "/cms/availability",
		});
	}

	for (const page of legalPages) {
		if (now.getTime() - page.updatedAt.getTime() > LEGAL_STALE_MS) {
			alerts.push({
				id: `legal-stale-${page.slug}`,
				severity: "info",
				message: `"${page.title}" hasn't been updated in over a year`,
				href: "/cms/legal",
			});
		}
	}

	return {
		counts: {
			blogs: { total: blogStats.total, published: blogStats.published },
			projects: { total: projectStats.total, published: projectStats.published },
			contacts: { total: contactStats.total, unread: contactStats.unread },
			serviceRequests: { total: requestStats.total, pending: requestStats.pending },
			hireRequests: { total: hireStats.total, pending: hireStats.pending },
			totalViews: blogStats.views + projectStats.views,
		},
		inbox,
		drafts,
		topContent,
		alerts,
	};
}
