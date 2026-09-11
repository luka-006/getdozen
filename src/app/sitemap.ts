import type { MetadataRoute } from "next";
import { blogTagPath, getBlogPosts, getIndexableBlogTags } from "@/lib/blog";
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

  const tags = getIndexableBlogTags().map((tag) => ({
    url: absoluteUrl(blogTagPath(tag)),
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  return [...pages, ...tags, ...posts];
}
