"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { TestimonialsForm } from "./testimonials-form";

// Suspense boundary kept for consistency with the other CMS form pages.
export default function NewTestimonialPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-96">
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
				</div>
			}
		>
			<TestimonialsForm />
		</Suspense>
	);
}
