"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { ServiceCatalogForm } from "./service-catalog-form";

export default function NewServiceCatalogPage() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center h-96">
					<Loader2 className="h-10 w-10 animate-spin text-primary" />
				</div>
			}
		>
			<ServiceCatalogForm />
		</Suspense>
	);
}
