"use server";

import { cmsFetch } from "@/lib/cms-client";
import type { ProcessScope, ProcessStep } from "./types";

export async function getPublished(scope: ProcessScope): Promise<ProcessStep[]> {
  try {
    return await cmsFetch<ProcessStep[]>(`/api/v1/public/process-steps?scope=${scope}`, {
      tags: ["content:process-steps"],
      revalidate: 86400,
    });
  } catch (e) {
    console.error("[process-steps] getPublished error:", e);
    return [];
  }
}
