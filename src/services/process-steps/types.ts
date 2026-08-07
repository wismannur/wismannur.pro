export type ProcessScope = "services" | "hire-me";

// Process/how-it-works steps; /services and /hire-me each own a set, picked
// by `scope`. Step numbers ("01" …) are derived from display order, not
// stored. `icon` is a lucide name (the /services set renders numbers instead
// and leaves it empty).
export interface ProcessStep {
	id: string;
	scope: ProcessScope;
	title: string;
	description: string;
	icon?: string;
	sortOrder: number;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type NewProcessStep = Omit<ProcessStep, "id" | "createdAt" | "updatedAt">;
export type UpdateProcessStep = Partial<NewProcessStep>;
