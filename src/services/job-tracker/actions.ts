"use server";

import { revalidatePath } from "next/cache";
import { asc, desc, eq } from "drizzle-orm";

import { getDb, schema } from "@/db";
import type {
	JobApplicationRow,
	JobInterviewRow,
} from "@/db/schema";
import { assertAdmin } from "../core/auth-guard";
import {
	analyzeResumeMatchWithGemini,
	generateInterviewPrepWithGemini,
	parseInterviewInvitationWithGemini,
	parseJobPostingWithGemini,
} from "./gemini-ai";
import type {
	AtsAnalysis,
	InterviewPrepResult,
	JobApplication,
	JobApplicationStatus,
	JobInterview,
	JobPlatform,
	JobTrackerAnalytics,
	NewJobApplication,
	NewJobInterview,
	ParsedInterviewInvitation,
	ParsedJobPosting,
	PredictedQuestion,
	TailoredBullet,
	UpdateJobApplication,
	UpdateJobInterview,
} from "./types";

const { jobApplications, jobInterviews, resumeEntries, skills } = schema;

function revalidateTrackerPaths(id?: string) {
	revalidatePath("/cms/job-tracker");
	if (id) {
		revalidatePath(`/cms/job-tracker/${id}`);
	}
}

const toJobInterview = (row: JobInterviewRow): JobInterview => ({
	id: row.id,
	applicationId: row.applicationId,
	stageType: row.stageType,
	title: row.title,
	scheduledAt: row.scheduledAt,
	interviewers: row.interviewers ?? undefined,
	meetingLink: row.meetingLink ?? undefined,
	rawInvitation: row.rawInvitation ?? undefined,
	aiSummary: row.aiSummary ?? undefined,
	aiPredictedQuestions: (row.aiPredictedQuestions as PredictedQuestion[] | null) ?? undefined,
	notes: row.notes ?? undefined,
	feedback: row.feedback ?? undefined,
	status: row.status,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
});

const toJobApplication = (
	row: JobApplicationRow,
	interviews: JobInterview[] = [],
): JobApplication => ({
	id: row.id,
	companyName: row.companyName,
	companyLogo: row.companyLogo ?? undefined,
	companyWebsite: row.companyWebsite ?? undefined,
	jobTitle: row.jobTitle,
	jobUrl: row.jobUrl ?? undefined,
	platform: row.platform,
	location: row.location ?? undefined,
	workplaceType: row.workplaceType,
	jobType: row.jobType,
	salaryMin: row.salaryMin ?? undefined,
	salaryMax: row.salaryMax ?? undefined,
	salaryCurrency: row.salaryCurrency,
	salaryPeriod: row.salaryPeriod,
	jobDescriptionRaw: row.jobDescriptionRaw ?? undefined,
	requirements: row.requirements ?? [],
	status: row.status,
	appliedAt: row.appliedAt ?? undefined,
	atsScore: row.atsScore ?? undefined,
	atsAnalysis: (row.atsAnalysis as AtsAnalysis | null) ?? undefined,
	tailoredSummary: row.tailoredSummary ?? undefined,
	tailoredBulletPoints: (row.tailoredBulletPoints as TailoredBullet[] | null) ?? undefined,
	coverLetter: row.coverLetter ?? undefined,
	notes: row.notes ?? undefined,
	contactName: row.contactName ?? undefined,
	contactEmail: row.contactEmail ?? undefined,
	contactPhone: row.contactPhone ?? undefined,
	followUpDate: row.followUpDate ?? undefined,
	sortOrder: row.sortOrder,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
	interviews,
});

export async function getAllApplications(): Promise<JobApplication[]> {
	await assertAdmin();

	const db = getDb();
	const appRows = await db
		.select()
		.from(jobApplications)
		.orderBy(desc(jobApplications.updatedAt));

	const interviewRows = await db
		.select()
		.from(jobInterviews)
		.orderBy(asc(jobInterviews.scheduledAt));

	const interviewsByApp = new Map<string, JobInterview[]>();
	for (const intRow of interviewRows) {
		const list = interviewsByApp.get(intRow.applicationId) ?? [];
		list.push(toJobInterview(intRow));
		interviewsByApp.set(intRow.applicationId, list);
	}

	return appRows.map((app) =>
		toJobApplication(app, interviewsByApp.get(app.id) ?? []),
	);
}

export async function getApplicationById(id: string): Promise<JobApplication | null> {
	await assertAdmin();

	const db = getDb();
	const [appRow] = await db
		.select()
		.from(jobApplications)
		.where(eq(jobApplications.id, id))
		.limit(1);

	if (!appRow) return null;

	const interviewRows = await db
		.select()
		.from(jobInterviews)
		.where(eq(jobInterviews.applicationId, id))
		.orderBy(asc(jobInterviews.scheduledAt));

	return toJobApplication(appRow, interviewRows.map(toJobInterview));
}

export async function createApplication(data: NewJobApplication): Promise<string> {
	await assertAdmin();

	const db = getDb();
	const [{ id }] = await db
		.insert(jobApplications)
		.values({
			...data,
			appliedAt: data.status === "applied" && !data.appliedAt ? new Date() : (data.appliedAt ?? null),
			companyLogo: data.companyLogo ?? null,
			companyWebsite: data.companyWebsite ?? null,
			jobUrl: data.jobUrl ?? null,
			location: data.location ?? null,
			salaryMin: data.salaryMin ?? null,
			salaryMax: data.salaryMax ?? null,
			jobDescriptionRaw: data.jobDescriptionRaw ?? null,
			atsScore: data.atsScore ?? null,
			atsAnalysis: data.atsAnalysis ?? null,
			tailoredSummary: data.tailoredSummary ?? null,
			tailoredBulletPoints: data.tailoredBulletPoints ?? null,
			coverLetter: data.coverLetter ?? null,
			notes: data.notes ?? null,
			contactName: data.contactName ?? null,
			contactEmail: data.contactEmail ?? null,
			contactPhone: data.contactPhone ?? null,
			followUpDate: data.followUpDate ?? null,
		})
		.returning({ id: jobApplications.id });

	revalidateTrackerPaths();
	return id;
}

export async function updateApplication(
	id: string,
	data: UpdateJobApplication,
): Promise<void> {
	await assertAdmin();

	const db = getDb();
	await db
		.update(jobApplications)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(jobApplications.id, id));

	revalidateTrackerPaths(id);
}

export async function updateApplicationStatus(
	id: string,
	status: JobApplicationStatus,
): Promise<void> {
	await assertAdmin();

	const db = getDb();
	const [existing] = await db
		.select({ status: jobApplications.status, appliedAt: jobApplications.appliedAt })
		.from(jobApplications)
		.where(eq(jobApplications.id, id))
		.limit(1);

	const updatePayload: Partial<JobApplicationRow> = {
		status,
		updatedAt: new Date(),
	};

	// Auto-fill appliedAt if transitioned to applied and was previously wishlist without date
	if (status === "applied" && !existing?.appliedAt) {
		updatePayload.appliedAt = new Date();
	}

	await db
		.update(jobApplications)
		.set(updatePayload)
		.where(eq(jobApplications.id, id));

	revalidateTrackerPaths(id);
}

export async function deleteApplication(id: string): Promise<void> {
	await assertAdmin();

	const db = getDb();
	await db.delete(jobApplications).where(eq(jobApplications.id, id));

	revalidateTrackerPaths();
}

export async function createInterview(data: NewJobInterview): Promise<string> {
	await assertAdmin();

	const db = getDb();
	const [{ id }] = await db
		.insert(jobInterviews)
		.values({
			...data,
			interviewers: data.interviewers ?? null,
			meetingLink: data.meetingLink ?? null,
			rawInvitation: data.rawInvitation ?? null,
			aiSummary: data.aiSummary ?? null,
			aiPredictedQuestions: data.aiPredictedQuestions ?? null,
			notes: data.notes ?? null,
			feedback: data.feedback ?? null,
		})
		.returning({ id: jobInterviews.id });

	// Auto-advance application status if it's currently earlier than interview
	const [app] = await db
		.select({ status: jobApplications.status })
		.from(jobApplications)
		.where(eq(jobApplications.id, data.applicationId))
		.limit(1);

	if (app && (app.status === "wishlist" || app.status === "applied" || app.status === "screening")) {
		const targetStatus =
			data.stageType === "hr_screening"
				? "interview_hr"
				: data.stageType === "user_interview" || data.stageType === "final_leadership"
					? "interview_user"
					: "interview_tech";

		await db
			.update(jobApplications)
			.set({ status: targetStatus, updatedAt: new Date() })
			.where(eq(jobApplications.id, data.applicationId));
	}

	revalidateTrackerPaths(data.applicationId);
	return id;
}

export async function updateInterview(
	id: string,
	data: UpdateJobInterview,
): Promise<void> {
	await assertAdmin();

	const db = getDb();
	const [intRow] = await db
		.update(jobInterviews)
		.set({
			...data,
			updatedAt: new Date(),
		})
		.where(eq(jobInterviews.id, id))
		.returning({ applicationId: jobInterviews.applicationId });

	if (intRow) {
		revalidateTrackerPaths(intRow.applicationId);
	}
}

export async function deleteInterview(id: string): Promise<void> {
	await assertAdmin();

	const db = getDb();
	const [intRow] = await db
		.delete(jobInterviews)
		.where(eq(jobInterviews.id, id))
		.returning({ applicationId: jobInterviews.applicationId });

	if (intRow) {
		revalidateTrackerPaths(intRow.applicationId);
	}
}

export async function getAnalytics(): Promise<JobTrackerAnalytics> {
	await assertAdmin();

	const applications = await getAllApplications();
	const totalApplications = applications.length;

	const now = new Date();
	const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const startOfWeek = new Date(now);
	startOfWeek.setDate(now.getDate() - now.getDay());
	startOfWeek.setHours(0, 0, 0, 0);
	const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

	let appliedToday = 0;
	let appliedThisWeek = 0;
	let appliedThisMonth = 0;
	let activeInterviews = 0;
	let totalOffers = 0;
	let totalProgressedBeyondApplied = 0;

	const statusCounts: Record<JobApplicationStatus, number> = {
		wishlist: 0,
		applied: 0,
		screening: 0,
		interview_hr: 0,
		interview_tech: 0,
		interview_user: 0,
		offering: 0,
		accepted: 0,
		rejected: 0,
		withdrawn: 0,
		ghosted: 0,
	};

	const platformCounts: Record<JobPlatform, number> = {
		linkedin: 0,
		jobstreet: 0,
		glints: 0,
		techinasia: 0,
		indeed: 0,
		company_website: 0,
		referral: 0,
		other: 0,
	};

	const activityMap = new Map<string, number>();

	for (const app of applications) {
		statusCounts[app.status] = (statusCounts[app.status] ?? 0) + 1;
		platformCounts[app.platform] = (platformCounts[app.platform] ?? 0) + 1;

		if (app.status === "offering" || app.status === "accepted") {
			totalOffers += 1;
		}

		if (
			app.status !== "wishlist" &&
			app.status !== "applied" &&
			app.status !== "rejected" &&
			app.status !== "withdrawn"
		) {
			totalProgressedBeyondApplied += 1;
		}

		if (
			app.status === "interview_hr" ||
			app.status === "interview_tech" ||
			app.status === "interview_user"
		) {
			activeInterviews += 1;
		}

		const appDate = app.appliedAt || app.createdAt;
		if (appDate) {
			const dateKey = appDate.toISOString().split("T")[0];
			activityMap.set(dateKey, (activityMap.get(dateKey) ?? 0) + 1);

			if (appDate >= startOfToday) appliedToday++;
			if (appDate >= startOfWeek) appliedThisWeek++;
			if (appDate >= startOfMonth) appliedThisMonth++;
		}
	}

	const responseRate =
		totalApplications > 0
			? Math.round((totalProgressedBeyondApplied / totalApplications) * 100)
			: 0;

	const offerRate =
		totalApplications > 0
			? Math.round((totalOffers / totalApplications) * 100)
			: 0;

	// Sort activity for the last 14 days
	const recentActivity: { date: string; count: number }[] = [];
	for (let i = 13; i >= 0; i--) {
		const d = new Date();
		d.setDate(d.getDate() - i);
		const dateStr = d.toISOString().split("T")[0];
		recentActivity.push({
			date: dateStr,
			count: activityMap.get(dateStr) ?? 0,
		});
	}

	const funnel = [
		{
			stage: "Total Applications",
			count: totalApplications,
			percentage: 100,
		},
		{
			stage: "Applied / Sourced",
			count: totalApplications - statusCounts.wishlist,
			percentage: totalApplications > 0 ? Math.round(((totalApplications - statusCounts.wishlist) / totalApplications) * 100) : 0,
		},
		{
			stage: "Screening & Assessment",
			count:
				statusCounts.screening +
				statusCounts.interview_hr +
				statusCounts.interview_tech +
				statusCounts.interview_user +
				statusCounts.offering +
				statusCounts.accepted,
			percentage: totalApplications > 0 ? Math.round(((statusCounts.screening + statusCounts.interview_hr + statusCounts.interview_tech + statusCounts.interview_user + statusCounts.offering + statusCounts.accepted) / totalApplications) * 100) : 0,
		},
		{
			stage: "Interviews",
			count:
				statusCounts.interview_hr +
				statusCounts.interview_tech +
				statusCounts.interview_user +
				statusCounts.offering +
				statusCounts.accepted,
			percentage: totalApplications > 0 ? Math.round(((statusCounts.interview_hr + statusCounts.interview_tech + statusCounts.interview_user + statusCounts.offering + statusCounts.accepted) / totalApplications) * 100) : 0,
		},
		{
			stage: "Offers Received",
			count: statusCounts.offering + statusCounts.accepted,
			percentage: totalApplications > 0 ? Math.round(((statusCounts.offering + statusCounts.accepted) / totalApplications) * 100) : 0,
		},
	];

	return {
		totalApplications,
		appliedToday,
		appliedThisWeek,
		appliedThisMonth,
		activeInterviews,
		totalOffers,
		responseRate,
		offerRate,
		statusCounts,
		platformCounts,
		recentActivity,
		funnel,
	};
}

// AI Integration Server Actions

export async function aiParseJobPosting(
	rawContent: string,
): Promise<ParsedJobPosting> {
	await assertAdmin();
	return parseJobPostingWithGemini(rawContent);
}

export async function aiAnalyzeResumeMatch(applicationId: string): Promise<AtsAnalysis> {
	await assertAdmin();

	const db = getDb();
	const [application] = await db
		.select()
		.from(jobApplications)
		.where(eq(jobApplications.id, applicationId))
		.limit(1);

	if (!application) {
		throw new Error("Job application not found");
	}

	const allResumeRows = await db
		.select()
		.from(resumeEntries)
		.orderBy(desc(resumeEntries.startDate));

	const allSkills = await db
		.select()
		.from(skills)
		.orderBy(asc(skills.sortOrder));

	const masterResume = {
		experiences: allResumeRows
			.filter((r) => r.kind === "experience")
			.map((r) => ({
				title: r.title,
				organization: r.organization,
				description: r.description,
				period: `${r.startDate} - ${r.isCurrent ? "Present" : (r.endDate ?? "")}`,
			})),
		education: allResumeRows
			.filter((r) => r.kind === "education")
			.map((r) => ({
				title: r.title,
				organization: r.organization,
				description: r.description,
			})),
	};

	const result = await analyzeResumeMatchWithGemini({
		jobTitle: application.jobTitle,
		companyName: application.companyName,
		jobDescription: application.jobDescriptionRaw || "",
		requirements: application.requirements || [],
		masterResume,
		skills: allSkills.map((s) => ({ name: s.name })),
	});

	await db
		.update(jobApplications)
		.set({
			atsScore: result.atsAnalysis.score,
			atsAnalysis: result.atsAnalysis,
			tailoredSummary: result.tailoredSummary,
			tailoredBulletPoints: result.tailoredBulletPoints,
			coverLetter: result.coverLetter,
			updatedAt: new Date(),
		})
		.where(eq(jobApplications.id, applicationId));

	revalidateTrackerPaths(applicationId);
	return result.atsAnalysis;
}

export async function aiParseInterviewInvitation(
	invitationText: string,
): Promise<ParsedInterviewInvitation> {
	await assertAdmin();
	return parseInterviewInvitationWithGemini(invitationText);
}

export async function aiGenerateInterviewPrep(
	interviewId: string,
): Promise<InterviewPrepResult> {
	await assertAdmin();

	const db = getDb();
	const [interview] = await db
		.select()
		.from(jobInterviews)
		.where(eq(jobInterviews.id, interviewId))
		.limit(1);

	if (!interview) {
		throw new Error("Interview session not found");
	}

	const [application] = await db
		.select()
		.from(jobApplications)
		.where(eq(jobApplications.id, interview.applicationId))
		.limit(1);

	if (!application) {
		throw new Error("Associated job application not found");
	}

	const allResumeRows = await db
		.select()
		.from(resumeEntries)
		.orderBy(desc(resumeEntries.startDate));

	const masterResume = allResumeRows
		.filter((r) => r.kind === "experience")
		.map((r) => ({
			title: r.title,
			organization: r.organization,
			description: r.description,
		}));

	const prepResult = await generateInterviewPrepWithGemini({
		jobTitle: application.jobTitle,
		companyName: application.companyName,
		jobDescription: application.jobDescriptionRaw || "",
		stageType: interview.stageType,
		masterResume,
	});

	await db
		.update(jobInterviews)
		.set({
			aiSummary: prepResult.stageSummary,
			aiPredictedQuestions: prepResult.questions,
			updatedAt: new Date(),
		})
		.where(eq(jobInterviews.id, interviewId));

	revalidateTrackerPaths(interview.applicationId);
	return prepResult;
}
