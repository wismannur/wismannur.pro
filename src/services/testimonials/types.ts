// Client testimonials on /hire-me. Drafts by default — the section only
// renders when at least one published row exists.
export interface Testimonial {
	id: string;
	authorName: string;
	authorRole: string;
	quote: string;
	avatarUrl?: string;
	rating: number;
	sortOrder: number;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type NewTestimonial = Omit<Testimonial, "id" | "createdAt" | "updatedAt">;
export type UpdateTestimonial = Partial<NewTestimonial>;
