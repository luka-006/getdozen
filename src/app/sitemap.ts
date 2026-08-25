import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/lib/blog";
import { absoluteUrl, SITEMAP_PATHS } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = SITEMAP_PATHS.map((entry) => ({
    url: absoluteUrl(entry.path),
    lastModified: new Date(),
    changeFrequency: entry.changeFrequency,
    priority: entry.priority,
  }));

  const posts = getBlogPosts().map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const feed = {
    url: absoluteUrl("/blog/rss.xml"),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.5,
  };

  return [...pages, feed, ...posts];
}
