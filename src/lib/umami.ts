// Custom event tracking.
// During the frontend-only phase there is no real Umami instance, so this falls
// back to a dev console log. It still forwards to `window.umami` if present.
export const trackEvent = (eventName: string, eventData?: Record<string, TAny>) => {
	if (typeof window !== "undefined" && window.umami) {
		window.umami.track(eventName, eventData);
	} else if (process.env.NODE_ENV !== "production") {
		console.log(`[DEV Analytics] Event: ${eventName}`, eventData || {});
	}
};
