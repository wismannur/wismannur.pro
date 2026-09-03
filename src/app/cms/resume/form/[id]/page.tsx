"use client";

import { Loader2 } from "lucide-react";
import { Suspense } from "react";

import { ResumeForm } from "../resume-form";

// Suspense boundary: ResumeForm reads `?kind=` to preselect the entry type.
export default function EditResumeEntryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <ResumeForm />
    </Suspense>
  );
}
