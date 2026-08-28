// Custom event tracking and route management for Umami Analytics.
// In development without an Umami script loaded, it logs to the dev console.
// When window.umami is available, it dispatches the event.

/**
 * Checks if a given pathname is a public page where tracking is allowed.
 * Returns false for auth pages (/login), CMS admin pages (/cms), and API routes.
 */
export function isTrackingAllowed(pathname?: string): boolean {
	if (typeof window === "undefined" && !pathname) return false;
	const currentPath = pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
	if (!currentPath) return false;

	const normalized = currentPath.toLowerCase();

	// Explicitly block auth and CMS routes
	if (
		normalized === "/login" ||
		normalized.startsWith("/login/") ||
		normalized === "/cms" ||
		normalized.startsWith("/cms/") ||
		normalized.startsWith("/api/")
	) {
		return false;
	}

	return true;
}

/**
 * Tracks custom events to Umami Analytics if on a public page.
 * Strictly prevents tracking on auth / CMS pages.
 */
export const trackEvent = (
	eventName: string,
	eventData?: Record<string, string | number | boolean | null | undefined>,
) => {
	if (typeof window === "undefined") return;

	// Prevent tracking on auth / cms pages
	if (!isTrackingAllowed(window.location.pathname)) {
		return;
	}

	if (window.umami) {
		window.umami.track(eventName, eventData as Record<string, TAny>);
	} else if (process.env.NODE_ENV !== "production") {
		console.log(`[Analytics DEV] ${eventName}:`, eventData ?? {});
	}
};

/**
 * Tracks pageviews to Umami Analytics for public pages.
 * Strictly prevents tracking on auth / CMS pages.
 */
export const trackPageView = (url?: string, title?: string) => {
	if (typeof window === "undefined") return;

	const pathname = url ?? window.location.pathname;
	if (!isTrackingAllowed(pathname)) {
		return;
	}

	if (window.umami) {
		if (url) {
			window.umami.track((props) => ({
				...props,
				url,
				title: title ?? (typeof document !== "undefined" ? document.title : undefined),
			}));
		} else {
			window.umami.track();
		}
	} else if (process.env.NODE_ENV !== "production") {
		console.log(`[Analytics DEV PageView]:`, {
			url: pathname,
			title: title ?? (typeof document !== "undefined" ? document.title : undefined),
		});
	}
};


