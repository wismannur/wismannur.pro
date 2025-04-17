export const APP_CONFIG = {
	ITEMS_PER_PAGE: 10, // Pagination default
	STALE_TIME: 1000 * 60 * 5, // 5 minutes
	COPYRIGHT: "© 2024 Wisman Nur. All rights reserved.",
	VERSION: "1.0.0",
	SITE_NAME: "Wisman Nur",
	SITE_URL: "https://wismannur.pro",
	SITE_DESCRIPTION: "Full-stack Developer & UI/UX Implementation Specialist",
	DEFAULT_LANGUAGE: "en",
	DEFAULT_THEME: "system",
	DEFAULT_TIMEZONE: "UTC+07:00",
} as const;

export const SOCIAL_LINKS = [
	{ href: "https://github.com/wismannur", icon: "Github", label: "GitHub" },
	{ href: "https://x.com/wismannur", icon: "Twitter", label: "Twitter" },
	{ href: "https://linkedin.com/in/wismannur", icon: "Linkedin", label: "LinkedIn" },
] as const;

export const CONTACT_INFO = {
	EMAIL: "hi@wismannur.pro",
	LOCATION: "Bandung, West Java, Indonesia",
	TIMEZONE: "Western Indonesian Time, UTC+07:00",
} as const;

export const SERVICE_RATES = {
	BASIC_HOURLY: 50,
	PROFESSIONAL_WEEKLY: 2000,
	CONSULTATION_HOURLY: 75,
} as const;

export const META_DEFAULTS = {
	TITLE_TEMPLATE: "%s | Wisman Nur",
	OG_IMAGE: "https://cdn.sundflow.cloud/f/3db6cf07e173ea509",
	TWITTER_HANDLE: "@wismannur",
} as const;

export const API_CONFIG = {
	BASE_URL: import.meta.env.VITE_API_URL || "http://localhost:3000",
	TIMEOUT: 90000, // 90 seconds
	RETRY_ATTEMPTS: 3,
} as const;

export const MY_USER_ID = "pjNM6QGiUfPY4BNMx1ZtIICAVOE3";
