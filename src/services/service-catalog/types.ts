// One service across its three render sites: the home "What I Do" grid
// (longDescription), the /services cards (description + price + features),
// and the /hire-me expertise tab (description). `icon` is a lucide name
// resolved through src/lib/icon-registry.ts.
export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription?: string;
  icon: string;
  priceLabel: string;
  features: string[];
  showOnHome: boolean;
  showOnHireMe: boolean;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NewServiceItem = Omit<ServiceItem, "id" | "createdAt" | "updatedAt">;
export type UpdateServiceItem = Partial<NewServiceItem>;
