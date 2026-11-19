import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/app-url";
import { waitlistMode } from "@/lib/launch";
import { ROBOTS_DISALLOW } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (waitlistMode()) {
    return {
      rules: {
        userAgent: "*",
        allow: "/$",
        disallow: "/",
      },
      sitemap: `${SITE_ORIGIN}/sitemap.xml`,
      host: SITE_ORIGIN,
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ROBOTS_DISALLOW,
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
