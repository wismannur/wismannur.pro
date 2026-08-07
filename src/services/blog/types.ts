// Dates are plain `Date` in the dummy-data phase (no Firestore Timestamp).
export interface Blog {
	id: string;
	title: string;
	slug: string;
	summary: string;
	content: string;
	image: string;
	isPublished: boolean;
	publishedDate: Date | null;
	createdAt: Date;
	updatedAt: Date;
	tags: string[];
	views: number;
	likes: number;
	readingTime: number;
	authorId: string;
	authorName: string;
}

export type NewBlog = Omit<Blog, "id" | "createdAt" | "updatedAt">;
export type UpdateBlog = Partial<Omit<Blog, "id" | "createdAt" | "updatedAt">>;
