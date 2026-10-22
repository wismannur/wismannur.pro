"use server";

import { cmsPost } from "@/lib/cms-client";
import { CMS_API_ENDPOINTS, type NewHireRequest } from "@wismannur.pro/cms-contracts";

export async function submit(formData: NewHireRequest, recaptchaToken?: string): Promise<string> {
  const result = await cmsPost<{ id: string }>(CMS_API_ENDPOINTS.INQUIRY_HIRE, {
    ...formData,
    recaptchaToken,
  });
  return result.id;
}
