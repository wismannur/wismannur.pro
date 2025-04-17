import { TReCaptchaResponse } from "@/types/global";

const env = import.meta.env;

const GOOGLE_RECAPTCHA = {
	SITE_KEY: env.VITE_GOOGLE_RECAPTCHA_SITE_KEY,
	BASE_URL: env.VITE_GOOGLE_RECAPTCHA_BASE_URL,
};

export const validateCaptchaToken = async () => {
	const token = await window.grecaptcha.execute(GOOGLE_RECAPTCHA.SITE_KEY, { action: "submit" });

	const res = await fetch(GOOGLE_RECAPTCHA.BASE_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ token }),
	});

	return (await res.json()) as TReCaptchaResponse;
};
