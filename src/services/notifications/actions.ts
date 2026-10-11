"use server";

import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { assertAdmin } from "../core/auth-guard";
import type {
  NotificationEntityType,
  NotificationSummaryResponse,
  UnreadEmailCounts,
  UnreadNotificationItem,
} from "./types";

const { contacts, serviceRequests, hireRequests, jobOutreaches } = schema;

export async function getNotificationSummary(): Promise<NotificationSummaryResponse> {
  await assertAdmin();
  const db = getDb();

  // 1. Run ultra-fast aggregate counts in parallel
  const [
    [contactStats],
    [serviceStats],
    [hireStats],
    [outreachStats],
    recentContacts,
    recentServices,
    recentHires,
    recentOutreaches,
  ] = await Promise.all([
    db
      .select({
        unread: sql<number>`count(*) filter (where ${contacts.status} = 'new')::int`,
      })
      .from(contacts),
    db
      .select({
        unread: sql<number>`count(*) filter (where ${serviceRequests.status} = 'new')::int`,
      })
      .from(serviceRequests),
    db
      .select({
        unread: sql<number>`count(*) filter (where ${hireRequests.status} = 'new')::int`,
      })
      .from(hireRequests),
    db
      .select({
        unread: sql<number>`count(*) filter (where ${jobOutreaches.status} = 'replied')::int`,
      })
      .from(jobOutreaches),

    // 2. Fetch top 5 recent unread items per category for dropdown preview
    db
      .select({
        id: contacts.id,
        name: contacts.name,
        subject: contacts.subject,
        message: contacts.message,
        createdAt: contacts.createdAt,
      })
      .from(contacts)
      .where(eq(contacts.status, "new"))
      .orderBy(desc(contacts.createdAt))
      .limit(5),

    db
      .select({
        id: serviceRequests.id,
        name: serviceRequests.name,
        serviceType: serviceRequests.serviceType,
        projectDetails: serviceRequests.projectDetails,
        createdAt: serviceRequests.createdAt,
      })
      .from(serviceRequests)
      .where(eq(serviceRequests.status, "new"))
      .orderBy(desc(serviceRequests.createdAt))
      .limit(5),

    db
      .select({
        id: hireRequests.id,
        name: hireRequests.name,
        roleTitle: hireRequests.roleTitle,
        message: hireRequests.message,
        createdAt: hireRequests.createdAt,
      })
      .from(hireRequests)
      .where(eq(hireRequests.status, "new"))
      .orderBy(desc(hireRequests.createdAt))
      .limit(5),

    db
      .select({
        id: jobOutreaches.id,
        companyName: jobOutreaches.companyName,
        contactName: jobOutreaches.contactName,
        subject: jobOutreaches.subject,
        body: jobOutreaches.body,
        lastRepliedAt: jobOutreaches.lastRepliedAt,
        createdAt: jobOutreaches.createdAt,
      })
      .from(jobOutreaches)
      .where(eq(jobOutreaches.status, "replied"))
      .orderBy(desc(jobOutreaches.lastRepliedAt), desc(jobOutreaches.createdAt))
      .limit(5),
  ]);

  const contactCount = contactStats?.unread ?? 0;
  const serviceCount = serviceStats?.unread ?? 0;
  const hireCount = hireStats?.unread ?? 0;
  const outreachCount = outreachStats?.unread ?? 0;
  const total = contactCount + serviceCount + hireCount + outreachCount;

  const counts: UnreadEmailCounts = {
    contacts: contactCount,
    serviceRequests: serviceCount,
    hireRequests: hireCount,
    jobOutreaches: outreachCount,
    total,
  };

  const rawItems: UnreadNotificationItem[] = [
    ...recentContacts.map((c) => ({
      id: c.id,
      type: "contact" as const,
      title: c.name,
      subtitle: c.subject,
      snippet: c.message.replace(/<[^>]*>?/gm, "").slice(0, 120),
      createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString(),
      href: `/cms/contacts/${c.id}`,
    })),
    ...recentServices.map((s) => ({
      id: s.id,
      type: "service_request" as const,
      title: s.name,
      subtitle: s.serviceType,
      snippet: s.projectDetails.replace(/<[^>]*>?/gm, "").slice(0, 120),
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
      href: `/cms/services/${s.id}`,
    })),
    ...recentHires.map((h) => ({
      id: h.id,
      type: "hire_request" as const,
      title: h.name,
      subtitle: h.roleTitle,
      snippet: h.message.replace(/<[^>]*>?/gm, "").slice(0, 120),
      createdAt: h.createdAt ? new Date(h.createdAt).toISOString() : new Date().toISOString(),
      href: `/cms/hire-requests/${h.id}`,
    })),
    ...recentOutreaches.map((o) => ({
      id: o.id,
      type: "job_outreach" as const,
      title: `${o.contactName} (${o.companyName})`,
      subtitle: o.subject,
      snippet: o.body.replace(/<[^>]*>?/gm, "").slice(0, 120),
      createdAt: (o.lastRepliedAt || o.createdAt)
        ? new Date(o.lastRepliedAt || o.createdAt).toISOString()
        : new Date().toISOString(),
      href: `/cms/job-outreaches/${o.id}`,
    })),
  ];

  // Sort unified notifications by date descending
  rawItems.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    counts,
    recentItems: rawItems.slice(0, 8),
  };
}

export async function markAllNotificationsAsRead(
  entityType?: NotificationEntityType
): Promise<void> {
  await assertAdmin();
  const db = getDb();

  const updates: Promise<unknown>[] = [];

  if (!entityType || entityType === "contact") {
    updates.push(
      db.update(contacts).set({ status: "read" }).where(eq(contacts.status, "new"))
    );
  }

  if (!entityType || entityType === "service_request") {
    updates.push(
      db
        .update(serviceRequests)
        .set({ status: "in-progress" })
        .where(eq(serviceRequests.status, "new"))
    );
  }

  if (!entityType || entityType === "hire_request") {
    updates.push(
      db
        .update(hireRequests)
        .set({ status: "reviewed", updatedAt: new Date() })
        .where(eq(hireRequests.status, "new"))
    );
  }

  if (!entityType || entityType === "job_outreach") {
    updates.push(
      db
        .update(jobOutreaches)
        .set({ status: "follow_up_due", updatedAt: new Date() })
        .where(eq(jobOutreaches.status, "replied"))
    );
  }

  await Promise.all(updates);
}
