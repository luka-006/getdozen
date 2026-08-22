import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { BugReportButton } from "@/components/bug-report-button";
import { CookieBanner } from "@/components/cookie-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getProfile } from "@/lib/auth";
import { SITE_ORIGIN } from "@/lib/app-url";
import { isLaunchOpen } from "@/lib/launch";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";
import { DOZEN_MARK_INK } from "@/lib/dozen-mark-data";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const viewport: Viewport = {
  themeColor: DOZEN_MARK_INK,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "Dozen",
    "app testing",
    "user feedback",
    "12 testers",
    "closed tests",
    "beta testers",
    "indie app feedback",
  ],
  authors: [{ name: SITE_NAME, url: SITE_ORIGIN }],
  icons: {
    icon: [
      { url: "/icon-96.png", type: "image/png", sizes: "96x96" },
      { url: "/icon-48.png", type: "image/png", sizes: "48x48" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180" }],
    shortcut: "/icon-96.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_ORIGIN,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();

  return (
    <html
      lang="en"
      className={`${archivo.variable} ${plexSans.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink antialiased">
        <SiteHeader profile={profile} waitlistLock={!isLaunchOpen()} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <CookieBanner />
        <BugReportButton email={profile?.email ?? ""} />
      </body>
    </html>
  );
}
