import Footer from "@/components/layout/Footer";
import Header from "@/components/layout/Header";
import { env } from "@/constants/env";
import clsx from "clsx";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {env.isProduction && (
          <Script
            src={env.umami.scriptUrl}
            data-website-id={env.umami.websiteId}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body
        className={clsx(
          `${inter.className} flex flex-col min-h-screen bg-white dark:bg-black`,
          "bg-gradient-to-br from-sky-200/80 md:from-sky-200/90 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
        >
          <Header />
          <main className="container mx-auto flex flex-col grow">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
