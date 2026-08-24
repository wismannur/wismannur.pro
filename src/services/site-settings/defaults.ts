import type { SiteSettings } from "./types";

// Mirror of the seeded row — the fallback if the row is missing (fresh DB
// mid-migration) or the read throws during prerender. Keeps metadata/footer
// rendering instead of failing the build.
export const DEFAULT_SITE_SETTINGS: SiteSettings = {
	siteName: "Wisman Nur",
	titleDefault: "Wisman Nur - Frontend Software Engineer",
	titleTemplate: "%s | Wisman Nur",
	metaDescription:
		"I'm Wisman Nur, a frontend software engineer passionate about crafting high-performance web applications, seamless API integrations, and intuitive user experiences.",
	keywords: [
		"Wisman Nur",
		"Frontend Software Engineer",
		"React",
		"Next.js",
		"TypeScript",
		"Web Developer",
		"UI/UX",
	],
	twitterHandle: "@wismannur",
	themeColor: "#4F46E5",
	ogTitle: "Frontend Software Engineer",
	ogTagline:
		"High-performance web applications, seamless API integrations, and intuitive user experiences.",
	publicEmail: "wismannur.pro@gmail.com",
	location: "Bandung, West Java, Indonesia",
	timezoneLabel: "Western Indonesian Time, UTC+07:00",
	social: {
		github: "https://github.com/wismannur",
		twitter: "https://x.com/wismannur",
		linkedin: "https://linkedin.com/in/wismannur",
	},
	footerBio:
		"I'm Wisman Nur, a frontend software engineer passionate about crafting high-performance web applications, seamless API integrations, and intuitive user experiences.",
	footerTagline: "",
	copyrightName: "Wisman Nur",
	repoUrl: "https://github.com/wismannur/wismannur.pro",
	repoLinkLabel: "See the recent update on Github",
	footerProjectLinks: [],
	requestTimeframes: [
		{ id: "asap", label: "As soon as possible" },
		{ id: "1-2-weeks", label: "Within 1-2 weeks" },
		{ id: "1-month", label: "Within a month" },
		{ id: "flexible", label: "Flexible / Not urgent" },
	],
	requestBudgetRanges: [
		{ id: "under-1000", label: "Under $1,000" },
		{ id: "1000-5000", label: "$ 1,000 - $ 5,000" },
		{ id: "5000-10000", label: "$ 5,000 - $ 10,000" },
		{ id: "10000-plus", label: "$ 10,000+" },
		{ id: "hourly", label: "Hourly rate" },
	],
	enableBlog: true,
	updatedAt: new Date(0),
};
