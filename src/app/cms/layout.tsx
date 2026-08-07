import type { Metadata } from "next";
import type React from "react";

import { CmsShell } from "./cms-shell";

export const metadata: Metadata = {
	title: "Dashboard",
	robots: { index: false, follow: false },
};

export default function CmsLayoutRoute({ children }: { children: React.ReactNode }) {
	return <CmsShell>{children}</CmsShell>;
}
