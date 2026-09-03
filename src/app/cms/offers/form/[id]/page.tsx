"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { OffersForm } from "../offers-form";

export default function EditOfferPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <OffersForm />
    </Suspense>
  );
}
