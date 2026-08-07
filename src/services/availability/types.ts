export type AvailabilityStatus = "available" | "limited" | "booked";

// Availability slots on /hire-me. `month` is 1-12 (formatted client-side as
// "Sep 2026"); `label` is the badge text ("Available", "Fully Booked", …).
export interface AvailabilitySlot {
	id: string;
	month: number;
	year: number;
	status: AvailabilityStatus;
	label: string;
	sortOrder: number;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type NewAvailabilitySlot = Omit<AvailabilitySlot, "id" | "createdAt" | "updatedAt">;
export type UpdateAvailabilitySlot = Partial<NewAvailabilitySlot>;
