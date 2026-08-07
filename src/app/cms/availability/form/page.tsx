"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { AvailabilityForm } from "./availability-form";

export default function NewAvailabilitySlotPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-96">
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
				</div>
			}
		>
			<AvailabilityForm />
		</Suspense>
	);
}
