// Custom event tracking for Umami Analytics.
// In development without an Umami script loaded, it logs to the dev console.
// When window.umami is available, it dispatches the event.
export const trackEvent = (
	eventName: string,
	eventData?: Record<string, string | number | boolean | null | undefined>,
) => {
	if (typeof window !== "undefined" && window.umami) {
		window.umami.track(eventName, eventData as Record<string, TAny>);
	} else if (process.env.NODE_ENV !== "production") {
		console.log(`[Analytics DEV] ${eventName}:`, eventData ?? {});
	}
};

