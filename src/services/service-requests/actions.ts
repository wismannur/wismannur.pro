"use server";

import { cmsPost } from "@/lib/cms-client";
import { CMS_API_ENDPOINTS, type NewServiceRequest } from "@wismannur.pro/cms-contracts";

export async function submit(formData: NewServiceRequest, recaptchaToken?: string): Promise<string> {
  const result = await cmsPost<{ id: string }>(CMS_API_ENDPOINTS.INQUIRY_SERVICE, {
    ...formData,
    recaptchaToken,
  });
  return result.id;
}
