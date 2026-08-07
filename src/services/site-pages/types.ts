// Long-form MDX pages (privacy-policy, terms-of-service). `updatedAt` is
// shown publicly as the "Last updated" date.
export interface SitePage {
	id: string;
	slug: string;
	title: string;
	content: string;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type NewSitePage = Omit<SitePage, "id" | "createdAt" | "updatedAt">;
export type UpdateSitePage = Partial<NewSitePage>;
