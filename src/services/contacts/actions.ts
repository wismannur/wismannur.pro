"use server";

import { cmsPost } from "@/lib/cms-client";
import { CMS_API_ENDPOINTS, type ContactForm } from "@wismannur/cms-contracts";

export async function submit(formData: ContactForm, recaptchaToken?: string): Promise<string> {
  const result = await cmsPost<{ id: string }>(CMS_API_ENDPOINTS.INQUIRY_CONTACT, {
    ...formData,
    recaptchaToken,
  });
  return result.id;
}
