import { pageCopyService } from "@/services";
import type { NotFoundCopy } from "@/services/page-copy/types";
import { NotFoundView } from "./not-found-view";

// The 404 page must never 500 — if the copy read fails for any reason, fall
// back to the hardcoded defaults instead of surfacing the error.
const FALLBACK: NotFoundCopy = {
	badge: "404 Error",
	title: "Oops! Page not found",
	message:
		"The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
	primaryLabel: "Back to Home",
	secondaryLabel: "Contact Support",
	popularTitle: "Popular Pages",
};

export default async function NotFound() {
	let copy = FALLBACK;
	try {
		copy = (await pageCopyService.get("not-found")) ?? FALLBACK;
	} catch {
		// keep fallback
	}

	return <NotFoundView copy={copy} />;
}
