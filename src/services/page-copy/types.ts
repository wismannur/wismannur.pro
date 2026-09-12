// Per-page editable copy stored as one typed jsonb blob per page (the
// `page_copy` table). Text fields support two inline markers rendered by
// <HighlightedText />: `**text**` becomes the primary-colored span and
// `__text__` becomes a bold span — that's how "I'm **Wisman** Nur," keeps its
// accent without storing HTML in the database.

export type PageKey =
  | "home"
  | "about"
  | "services"
  | "hire-me"
  | "blog"
  | "projects"
  | "contact"
  | "not-found"
  | "default";

// The PowerfulCTACard block; the `default` page row is the fallback variant.
export interface CtaData {
  title: string;
  description: string;
  primaryButtonText: string;
  primaryButtonLink: string;
  primaryButtonScrollTo?: string;
  secondaryButtonText: string;
  secondaryButtonLink: string;
  badge: string;
  responseTime?: string;
}

export interface PageMeta {
  title: string;
  description: string;
}

// Matches <SectionHeader /> props.
export interface SectionCopy {
  title: string;
  subtitle?: string;
  description?: string;
}

export interface HomeCopy {
  meta: PageMeta;
  hero: {
    eyebrow: string;
    title: string;
    bio: string;
    videoUrl: string;
  };
  sections: {
    services: SectionCopy;
    blog: SectionCopy;
    projects: SectionCopy;
  };
  cta: CtaData;
}

export interface AboutCopy {
  meta: PageMeta;
  hero: {
    badge: string;
    photoUrl: string;
    photoBadge: string;
    statPills: Array<{ icon: string; label: string; variant: "primary" | "success" }>;
    title: string;
    paragraphs: string[];
  };
  skillsSection: SectionCopy;
  whySection: SectionCopy;
  whyCards: Array<{ icon: string; title: string; description: string }>;
  cta: CtaData;
}

export interface ServicesCopy {
  meta: PageMeta;
  header: SectionCopy;
  processSection: SectionCopy;
  requestSection: SectionCopy;
  faqSection: SectionCopy;
  cta: CtaData;
}

export interface HireMeCopy {
  meta: PageMeta;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  availabilitySection: {
    title: string;
    description: string;
    timezoneNote: string;
    contactNote: string;
  };
  servicesSection: SectionCopy;
  processSection: SectionCopy;
  testimonialsSection: SectionCopy;
  faqSection: SectionCopy;
  contactSection: SectionCopy;
  cta: CtaData;
}

// Blog + projects list pages share the same eyebrow/title/description header.
export interface ListHeaderCopy {
  meta: PageMeta;
  header: { eyebrow: string; title: string; description: string };
  cta: CtaData;
}

export interface ContactCopy {
  meta: PageMeta;
  header: SectionCopy;
}

export interface NotFoundCopy {
  badge: string;
  title: string;
  message: string;
  primaryLabel: string;
  secondaryLabel: string;
  popularTitle: string;
}

export interface DefaultCopy {
  cta: CtaData;
}

export interface PageCopyMap {
  home: HomeCopy;
  about: AboutCopy;
  services: ServicesCopy;
  "hire-me": HireMeCopy;
  blog: ListHeaderCopy;
  projects: ListHeaderCopy;
  contact: ContactCopy;
  "not-found": NotFoundCopy;
  default: DefaultCopy;
}

export type PageCopyContent = PageCopyMap[PageKey];

export interface PageCopyEntry {
  page: PageKey;
  content: PageCopyContent;
  updatedAt: Date;
}
