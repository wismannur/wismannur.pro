"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { ProcessStepsForm } from "../process-steps-form";

// Suspense boundary: ProcessStepsForm reads `?scope=` to preselect the scope.
export default function EditProcessStepPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <ProcessStepsForm />
    </Suspense>
  );
}
