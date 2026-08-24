import type { Metadata } from "next";
import { getCachedSiteSettings } from "@/lib/site-metadata";
import { resumeService, skillsService, userService } from "@/services";
import { CVView } from "./cv-view";

export async function generateMetadata(): Promise<Metadata> {
	const [user, settings] = await Promise.all([
		userService.getAuthorProfile(),
		getCachedSiteSettings(),
	]);

	const name = user?.displayName || settings.siteName || "Wisman Nur";
	const description =
		user?.bio ||
		`Curriculum Vitae and Professional Experience of ${name}. Full Stack & Frontend Engineer.`;

	return {
		title: {
			absolute: "cv-resume-wismannur.pro",
		},
		description,
		openGraph: {
			title: `CV / Resume | ${name}`,
			description,
			type: "profile",
		},
	};
}

export default async function CVPage() {
	const [{ experiences, education }, skills, user, settings] = await Promise.all([
		resumeService.getPublished(),
		skillsService.getPublished(),
		userService.getAuthorProfile(),
		getCachedSiteSettings(),
	]);

	return (
		<CVView
			user={user}
			experiences={experiences}
			education={education}
			skills={skills}
			settings={settings}
		/>
	);
}
