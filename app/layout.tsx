import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";

import BackToTop from "@/components/layout/BackToTop";
import ServiceWorkerRegistrar from "@/components/layout/ServiceWorkerRegistrar";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteHeader from "@/components/layout/SiteHeader";
import { site } from "@/lib/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: `%s — ${site.shortName}`,
  },
  description: site.description,
  applicationName: site.title,
  authors: [{ name: site.name }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.ico",
    apple: "/sh-dev-log.png",
  },
  openGraph: {
    type: "website",
    siteName: site.title,
    title: site.title,
    description: site.description,
    url: site.url,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  appleWebApp: {
    capable: true,
    title: site.title,
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f4" },
    { media: "(prefers-color-scheme: dark)", color: "#221f1b" },
  ],
};

/**
 * Applies the stored theme before first paint. Without this the page renders in
 * the OS scheme and then snaps to the stored choice — a visible flash.
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var dark = stored
      ? stored === "dark"
      : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark", dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang={site.locale}
      suppressHydrationWarning
      className={`${inter.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-contrast"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <BackToTop />
        <Analytics />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
