// The "Service Packages" cards on /hire-me.
export interface PricingTier {
	id: string;
	slug: string;
	name: string;
	priceLabel: string;
	description: string;
	features: string[];
	isPopular: boolean;
	ctaLabel: string;
	sortOrder: number;
	isPublished: boolean;
	createdAt: Date;
	updatedAt: Date;
}

export type NewPricingTier = Omit<PricingTier, "id" | "createdAt" | "updatedAt">;
export type UpdatePricingTier = Partial<NewPricingTier>;
