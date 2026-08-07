import type React from "react";

import { cn } from "@/lib/utils";
import { DEFAULT_SITE_SETTINGS } from "@/services/site-settings/defaults";
import type { SiteSettings } from "@/services/site-settings/types";
import { Footer } from "./footer";
import { Navbar } from "./navbar";
import { ScrollToTop } from "./scroll-to-top";

interface LayoutProps {
	children: React.ReactNode;
	// Optional so client-only pages (/login) can render without a server fetch;
	// the public layout always passes the DB-backed row.
	settings?: SiteSettings;
	// Add more flexibility to layout
	className?: string;
	hideNavbar?: boolean;
	hideFooter?: boolean;
}

export const Layout = ({
	children,
	settings = DEFAULT_SITE_SETTINGS,
	className,
	hideNavbar = false,
	hideFooter = false,
}: LayoutProps) => {
	return (
		<div className={cn("flex flex-col min-h-screen", className)}>
			{!hideNavbar && <Navbar copyrightName={settings.copyrightName} />}
			<main className="flex-1 pt-20">{children}</main>
			{!hideFooter && <Footer settings={settings} />}
			<ScrollToTop />
		</div>
	);
};
