import { z } from "zod";

export const MONTH_PATTERN = /^\d{4}-\d{2}$/;
export const toIsoDay = (month: string) => `${month}-01`;
export const toMonthInput = (isoDay?: string) => (isoDay ? isoDay.slice(0, 7) : "");

export const resumeSchema = z
  .object({
    kind: z.enum(["experience", "education"]),
    title: z.string().min(2, { message: "Title must be at least 2 characters" }),
    organization: z.string().min(2, { message: "Organization must be at least 2 characters" }),
    location: z.string().optional(),
    employmentType: z.string().optional(),
    locationType: z.string().optional(),
    startMonth: z.string().regex(MONTH_PATTERN, { message: "Pick a start month" }),
    endMonth: z.string().optional(),
    isCurrent: z.boolean().default(false),
    description: z.string().optional(),
    sortOrder: z.number().int(),
    isPublished: z.boolean().default(true),
  })
  .refine((data) => data.isCurrent || MONTH_PATTERN.test(data.endMonth ?? ""), {
    message: "Pick an end month, or mark this entry as ongoing",
    path: ["endMonth"],
  })
  .refine((data) => data.isCurrent || !data.endMonth || data.endMonth >= data.startMonth, {
    message: "End month cannot be earlier than the start month",
    path: ["endMonth"],
  });

export type ResumeFormValues = z.infer<typeof resumeSchema>;
