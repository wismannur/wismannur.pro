export interface SocialLinks {
	github: string;
	twitter: string;
	linkedin: string;
}

export interface LabeledLink {
	label: string;
	href: string;
}

export interface SelectOption {
	id: string;
	label: string;
}

// The singleton `site_settings` row (id 'site') — global identity, SEO,
// contact/social, footer copy, and the request-form dropdown options.
export interface SiteSettings {
	siteName: string;
	titleDefault: string;
	titleTemplate: string;
	metaDescription: string;
	keywords: string[];
	twitterHandle: string;
	themeColor: string;
	ogTitle: string;
	ogTagline: string;
	publicEmail: string;
	location: string;
	timezoneLabel: string;
	social: SocialLinks;
	footerBio: string;
	footerTagline: string;
	copyrightName: string;
	repoUrl: string;
	repoLinkLabel: string;
	footerProjectLinks: LabeledLink[];
	requestTimeframes: SelectOption[];
	requestBudgetRanges: SelectOption[];
	enableBlog: boolean;
	updatedAt: Date;
}

export type SiteSettingsUpdate = Partial<Omit<SiteSettings, "updatedAt">>;
