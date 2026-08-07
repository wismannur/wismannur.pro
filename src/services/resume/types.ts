export type ResumeKind = "experience" | "education";

// One shape for both /about lists — `kind` picks the labels ("Frontend
// Engineer" at "Rumah Siap Kerja" vs "Responsive Web Design" at
// "Freecodecamp.org"). Dates are ISO day strings ("2021-05-01") straight from
// the `date` columns, so no timezone shifting happens on the way to the UI.
export interface ResumeEntry {
	id: string;
	kind: ResumeKind;
	title: string;
	organization: string;
	location?: string;
	startDate: string;
	endDate?: string;
	isCurrent: boolean;
	description: string;
	sortOrder: number;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type NewResumeEntry = Omit<ResumeEntry, "id" | "createdAt" | "updatedAt">;
export type UpdateResumeEntry = Partial<NewResumeEntry>;

export type ResumeSections = {
	experiences: ResumeEntry[];
	education: ResumeEntry[];
};
