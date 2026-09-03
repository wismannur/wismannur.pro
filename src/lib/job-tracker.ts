import type {
  InterviewStageType,
  InterviewStatus,
  JobApplicationStatus,
  JobEmploymentType,
  JobPlatform,
  WorkplaceType,
} from "@/services/job-tracker/types";

export const JOB_STATUS_CONFIG: Record<
  JobApplicationStatus,
  {
    label: string;
    color: string;
    badgeVariant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  wishlist: {
    label: "Wishlist / Saved",
    color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    badgeVariant: "secondary",
  },
  applied: {
    label: "Applied",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    badgeVariant: "default",
  },
  screening: {
    label: "Screening / OA",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    badgeVariant: "outline",
  },
  interview_hr: {
    label: "HR Interview",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
    badgeVariant: "outline",
  },
  interview_tech: {
    label: "Technical / User",
    color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20",
    badgeVariant: "outline",
  },
  interview_user: {
    label: "Final / Leadership",
    color: "text-violet-500 bg-violet-500/10 border-violet-500/20",
    badgeVariant: "outline",
  },
  offering: {
    label: "Offering Letter 🎉",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    badgeVariant: "default",
  },
  accepted: {
    label: "Accepted 🚀",
    color: "text-green-600 bg-green-500/15 border-green-500/30 font-semibold",
    badgeVariant: "default",
  },
  rejected: {
    label: "Rejected",
    color: "text-red-500 bg-red-500/10 border-red-500/20",
    badgeVariant: "destructive",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20",
    badgeVariant: "secondary",
  },
  ghosted: {
    label: "No Response / Ghosted",
    color: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    badgeVariant: "secondary",
  },
};

export const JOB_PLATFORM_CONFIG: Record<JobPlatform, { label: string; color: string }> = {
  linkedin: { label: "LinkedIn", color: "bg-sky-600/10 text-sky-600 border-sky-600/20" },
  jobstreet: { label: "Jobstreet", color: "bg-purple-600/10 text-purple-600 border-purple-600/20" },
  glints: { label: "Glints", color: "bg-red-600/10 text-red-600 border-red-600/20" },
  techinasia: {
    label: "Tech in Asia",
    color: "bg-amber-600/10 text-amber-600 border-amber-600/20",
  },
  indeed: { label: "Indeed", color: "bg-blue-600/10 text-blue-600 border-blue-600/20" },
  company_website: {
    label: "Company Careers",
    color: "bg-emerald-600/10 text-emerald-600 border-emerald-600/20",
  },
  referral: { label: "Referral", color: "bg-teal-600/10 text-teal-600 border-teal-600/20" },
  other: { label: "Other Platform", color: "bg-zinc-600/10 text-zinc-600 border-zinc-600/20" },
};

export const WORKPLACE_CONFIG: Record<WorkplaceType, string> = {
  remote: "Remote 🌐",
  hybrid: "Hybrid 🏢",
  onsite: "On-site 📍",
};

export const EMPLOYMENT_TYPE_CONFIG: Record<JobEmploymentType, string> = {
  full_time: "Full-time",
  contract: "Contract",
  part_time: "Part-time",
  freelance: "Freelance",
  internship: "Internship",
};

export const INTERVIEW_STAGE_CONFIG: Record<InterviewStageType, { label: string; icon: string }> = {
  hr_screening: { label: "HR Initial Screening", icon: "UserCheck" },
  technical_interview: { label: "Technical Interview", icon: "Code2" },
  live_coding: { label: "Live Coding Session", icon: "Terminal" },
  take_home_test: { label: "Take-Home Assignment", icon: "FileCode" },
  user_interview: { label: "User / Team Lead Interview", icon: "Users" },
  system_design: { label: "System Design / Architecture", icon: "Cpu" },
  final_leadership: { label: "Final / VP / C-Level Interview", icon: "Award" },
  offering_discussion: { label: "Offering & Compensation Call", icon: "DollarSign" },
  other: { label: "Interview Session", icon: "Calendar" },
};

export const INTERVIEW_STATUS_CONFIG: Record<InterviewStatus, { label: string; color: string }> = {
  scheduled: { label: "Scheduled", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  completed: { label: "Completed", color: "text-slate-500 bg-slate-500/10 border-slate-500/20" },
  passed: { label: "Passed ✅", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  failed: { label: "Did Not Pass ❌", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  cancelled: { label: "Cancelled", color: "text-zinc-500 bg-zinc-500/10 border-zinc-500/20" },
};

export function formatSalary(
  min?: number,
  max?: number,
  currency = "IDR",
  period = "monthly"
): string {
  if (!min && !max) return "Undisclosed";

  const formatNumber = (num: number) => {
    if (currency === "IDR") {
      if (num >= 1_000_000) {
        return `${(num / 1_000_000).toFixed(num % 1_000_000 === 0 ? 0 : 1)}jt`;
      }
      return num.toLocaleString("id-ID");
    }
    if (num >= 1_000) {
      return `${(num / 1_000).toFixed(num % 1_000 === 0 ? 0 : 1)}k`;
    }
    return num.toLocaleString();
  };

  const periodSuffix = period === "monthly" ? "/mo" : period === "yearly" ? "/yr" : "/hr";

  if (min && max) {
    return `${currency} ${formatNumber(min)} - ${formatNumber(max)}${periodSuffix}`;
  }
  if (min) {
    return `From ${currency} ${formatNumber(min)}${periodSuffix}`;
  }
  return `Up to ${currency} ${formatNumber(max!)}${periodSuffix}`;
}

export function getAtsScoreColor(score?: number): {
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
} {
  if (score === undefined || score === null) {
    return {
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      borderColor: "border-border",
      label: "Not analyzed",
    };
  }
  if (score >= 80) {
    return {
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      label: "High Match (Great Fit)",
    };
  }
  if (score >= 60) {
    return {
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
      label: "Moderate Match",
    };
  }
  return {
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-500/10",
    borderColor: "border-rose-500/30",
    label: "Low Match / Needs Tailoring",
  };
}

export interface CalendarEventParams {
  title: string;
  companyName: string;
  jobTitle: string;
  scheduledAt: Date | string;
  durationMinutes?: number;
  meetingLink?: string;
  interviewers?: string;
  aiSummary?: string;
}

function formatUtcForCalendar(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/**
 * Generates a direct 1-click Google Calendar Event creation URL.
 */
export function generateGoogleCalendarUrl(params: CalendarEventParams): string {
  const start = new Date(params.scheduledAt);
  const end = new Date(start.getTime() + (params.durationMinutes || 60) * 60 * 1000);

  const eventTitle = `${params.title} - ${params.companyName} (${params.jobTitle})`;
  const dates = `${formatUtcForCalendar(start)}/${formatUtcForCalendar(end)}`;

  const details = [
    `Role: ${params.jobTitle}`,
    `Company: ${params.companyName}`,
    params.interviewers ? `Interviewers: ${params.interviewers}` : null,
    params.meetingLink ? `Meeting Link: ${params.meetingLink}` : null,
    params.aiSummary ? `\nAI Prep Strategy:\n${params.aiSummary}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const location = params.meetingLink || "Online Meeting";

  const url = new URL("https://calendar.google.com/calendar/render");
  url.searchParams.set("action", "TEMPLATE");
  url.searchParams.set("text", eventTitle);
  url.searchParams.set("dates", dates);
  url.searchParams.set("details", details);
  url.searchParams.set("location", location);

  return url.toString();
}

/**
 * Generates an iCalendar (.ics) format string.
 */
export function generateIcsContent(params: CalendarEventParams): string {
  const start = new Date(params.scheduledAt);
  const end = new Date(start.getTime() + (params.durationMinutes || 60) * 60 * 1000);
  const now = new Date();

  const uid = `interview-${start.getTime()}-${Math.random().toString(36).substring(2, 9)}@wismannur.pro`;
  const title = `${params.title} - ${params.companyName}`;
  const description = [
    `Role: ${params.jobTitle}`,
    `Company: ${params.companyName}`,
    params.interviewers ? `Interviewers: ${params.interviewers}` : "",
    params.meetingLink ? `Meeting: ${params.meetingLink}` : "",
    params.aiSummary ? `Strategy: ${params.aiSummary}` : "",
  ]
    .filter(Boolean)
    .join("\\n");

  const location = params.meetingLink || "Online";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wisman Nur//Career Hub//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatUtcForCalendar(now)}`,
    `DTSTART:${formatUtcForCalendar(start)}`,
    `DTEND:${formatUtcForCalendar(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    params.meetingLink ? `URL:${params.meetingLink}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

/**
 * Triggers a browser download of an .ics file.
 */
export function downloadIcsFile(params: CalendarEventParams): void {
  const content = generateIcsContent(params);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const safeFilename = `${params.companyName.toLowerCase().replace(/[^a-z0-9]/g, "_")}_interview.ics`;

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", safeFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
