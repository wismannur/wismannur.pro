import type { Metadata } from "next";

import { pageCopyService } from "@/services";
import { ProjectsView } from "./projects-view";

export async function generateMetadata(): Promise<Metadata> {
	const copy = await pageCopyService.get("projects");
	return {
		title: copy?.meta.title ?? "Projects",
		description: copy?.meta.description,
	};
}

export default async function ProjectsPage() {
	const copy = await pageCopyService.get("projects");
	return <ProjectsView copy={copy} />;
}
