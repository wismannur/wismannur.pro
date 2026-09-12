// Dates are plain `Date` in the dummy-data phase (no Firestore Timestamp).
export interface Project {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  image: string;
  isPublished: boolean;
  isFeatured: boolean;
  publishedDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  technologies: string[];
  demoUrl?: string;
  repoUrl?: string;
  views: number;
  likes: number;
  readingTime: number;
  authorId?: string;
  authorName?: string;
}

export type NewProject = Omit<Project, "id" | "createdAt" | "updatedAt">;
export type UpdateProject = Partial<Omit<Project, "id" | "createdAt" | "updatedAt">>;

// In the legacy code this was the Date-based "read" shape vs the Timestamp-based
// "store" shape. With everything on `Date` now they're identical.
export type TProjectResponse = Project;
