import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import type { RevalidationPayload } from "@wismannur/cms-contracts";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const secret = req.headers.get("x-revalidate-secret");
    const expectedSecret = process.env.REVALIDATION_SECRET;

    if (!expectedSecret || secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing revalidation secret token" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as RevalidationPayload;
    const { tags = [], paths = [] } = body;

    const revalidatedTags: string[] = [];
    const revalidatedPaths: string[] = [];

    // Revalidate by Cache Tags (ISR)
    for (const tag of tags) {
      if (typeof tag === "string" && tag.trim()) {
        try {
          revalidateTag(tag.trim(), { expire: 0 });
          revalidatedTags.push(tag.trim());
        } catch (err) {
          console.warn(`[Revalidation] Failed to revalidate tag '${tag}':`, err);
        }
      }
    }

    // Revalidate by Paths
    for (const path of paths) {
      if (typeof path === "string" && path.trim()) {
        try {
          revalidatePath(path.trim());
          revalidatedPaths.push(path.trim());
        } catch (err) {
          console.warn(`[Revalidation] Failed to revalidate path '${path}':`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      revalidatedTags,
      revalidatedPaths,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("[Revalidation API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during revalidation" },
      { status: 500 }
    );
  }
}
