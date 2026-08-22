import type { Metadata } from "next";
import { SITE_ORIGIN } from "@/lib/app-url";

export const SITE_NAME = "Dozen";
export const SITE_TAGLINE = "Test apps. Earn. Get feedback.";
export const SITE_DESCRIPTION =
  "Earn by testing other makers' apps. Post yours and get structured feedback.";

export const NO_INDEX: Metadata = {
  robots: { index: false, follow: false },
};

export type SitemapChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

/** Public marketing and legal URLs for sitemap.xml. Auth, admin, and APIs stay out. */
export const SITEMAP_PATHS: Array<{
  path: string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.8 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/wall", changeFrequency: "weekly", priority: 0.7 },
  { path: "/legal", changeFrequency: "yearly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms/payment", changeFrequency: "yearly", priority: 0.4 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
];

export const ROBOTS_DISALLOW = [
  "/login",
  "/signup",
  "/auth/",
  "/admin",
  "/wallet",
  "/setup",
  "/banned",
  "/waitlist/",
  "/api/",
  "/board",
  "/testers",
  "/requests/",
  "/reviews/",
  "/wall/new",
];

/** Metadata files crawlers and browsers hit without a session. */
export const PUBLIC_SEO_PATHS = [
  "/favicon.ico",
  "/icon",
  "/icon.svg",
  "/icon-48.png",
  "/icon-96.png",
  "/apple-icon",
  "/opengraph-image",
  "/twitter-image",
  "/robots.txt",
  "/sitemap.xml",
];

export function isPublicSeoPath(path: string): boolean {
  return PUBLIC_SEO_PATHS.includes(path);
}

export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path === "/" || path === "") return SITE_ORIGIN;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${suffix}`;
}

export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  /** Skip the root `%s · Dozen` template (home). */
  absoluteTitle?: boolean;
}): Metadata {
  const index = opts.index ?? true;
  const url = opts.path;
  return {
    title: opts.absoluteTitle ? { absolute: opts.title } : opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}
