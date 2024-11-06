import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import clsx from "clsx";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
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

        <Script
          src="https://umami.wnak.cloud/script.js"
          data-website-id="79728430-4694-434c-8b80-853b9c596518"
          data-domains="wismannur.pro"
        />
      </body>
    </html>
  );
}
