// Fixed-price packages on /offers (IDR). Replaces the old hardcoded
// src/data/offers.ts; `icon` is a lucide name resolved through
// src/lib/icon-registry.ts instead of an embedded component.
export interface Offer {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  price: number;
  forWho: string;
  extras: string[];
  isPopular: boolean;
  color?: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NewOffer = Omit<Offer, "id" | "createdAt" | "updatedAt">;
export type UpdateOffer = Partial<NewOffer>;
