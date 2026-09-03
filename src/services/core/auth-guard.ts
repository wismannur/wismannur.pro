import "server-only";

import { auth } from "@/auth";
import { ServiceError } from "./base-service";

// Session gate for CMS-only server actions (phase 8.4). Server actions are
// public POST endpoints — every mutating/admin action must call this first;
// the /cms/* proxy guard only protects page navigation, not the RPC layer.
export async function assertAdmin(): Promise<void> {
  const session = await auth();
  if (!session?.user) {
    throw new ServiceError("Unauthorized", "unauthorized");
  }
}

// Same gate, but returns the session's uid — for actions that write rows
// scoped to the signed-in admin (profile, settings, avatar).
export async function requireAdminUid(): Promise<string> {
  const session = await auth();
  const uid = (session?.user as { uid?: string } | undefined)?.uid;
  if (!uid) {
    throw new ServiceError("Unauthorized", "unauthorized");
  }
  return uid;
}
