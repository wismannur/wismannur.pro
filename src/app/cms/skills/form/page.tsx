"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { SkillsForm } from "./skills-form";

// Suspense boundary kept for consistency with the other CMS form pages.
export default function NewSkillPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-96">
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
				</div>
			}
		>
			<SkillsForm />
		</Suspense>
	);
}
