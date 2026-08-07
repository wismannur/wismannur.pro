// The "My Skills" grid on /about.
export interface Skill {
	id: string;
	name: string;
	sortOrder: number;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type NewSkill = Omit<Skill, "id" | "createdAt" | "updatedAt">;
export type UpdateSkill = Partial<NewSkill>;
