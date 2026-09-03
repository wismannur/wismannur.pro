// FAQ entries shared by /services and /hire-me (both render the same set).
export interface Faq {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NewFaq = Omit<Faq, "id" | "createdAt" | "updatedAt">;
export type UpdateFaq = Partial<NewFaq>;
