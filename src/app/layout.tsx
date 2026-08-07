import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { getCachedSiteSettings } from "@/lib/site-metadata";
import { SITE_URL } from "@/lib/site-url";
import { Providers } from "./providers";

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-inter",
	display: "swap",
});

// Identity/SEO values come from the CMS-managed site_settings row (with
// hardcoded defaults if the read fails), so edits go live without a redeploy.
export async function generateMetadata(): Promise<Metadata> {
	const settings = await getCachedSiteSettings();

	return {
		metadataBase: new URL(SITE_URL),
		title: {
			default: settings.titleDefault,
			template: settings.titleTemplate,
		},
		description: settings.metaDescription,
		applicationName: "wismannur.pro",
		authors: [{ name: settings.siteName, url: SITE_URL }],
		creator: settings.siteName,
		keywords: [...settings.keywords],
		manifest: "/favicon/site.webmanifest",
		icons: {
			icon: [
				{ url: "/favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
				{ url: "/favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
			],
			shortcut: "/favicon/favicon.ico",
			apple: "/favicon/apple-touch-icon.png",
		},
		openGraph: {
			type: "website",
			siteName: settings.siteName,
			title: settings.titleDefault,
			description: settings.metaDescription,
			url: SITE_URL,
			// og:image comes from src/app/opengraph-image.tsx (file convention).
		},
		twitter: {
			card: "summary_large_image",
			site: settings.twitterHandle,
			creator: settings.twitterHandle,
		},
	};
}

export async function generateViewport(): Promise<Viewport> {
	const settings = await getCachedSiteSettings();
	return {
		themeColor: settings.themeColor,
	};
}

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={inter.variable} suppressHydrationWarning>
			<body className="font-sans antialiased">
				<Providers>{children}</Providers>
				{RECAPTCHA_SITE_KEY && (
					<Script
						src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`}
						strategy="afterInteractive"
					/>
				)}
			</body>
		</html>
	);
}
