// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TAny = any;

// Initialize global types
declare global {
	interface Window {
		umami?: {
			track: (eventName: string, eventData?: Record<string, TAny>) => void;
		};
		grecaptcha?: {
			ready: (callback: () => void) => void;
			execute: (siteKey: string, options?: { action: string }) => Promise<string>;
		};
	}
}

export type TReCaptchaResponse = {
	success: boolean;
	score: number;
};
