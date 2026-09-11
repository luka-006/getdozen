import { getBlogPosts, getIndexableBlogTags, blogTagPath } from "@/lib/blog";
import { SITE_ORIGIN } from "@/lib/app-url";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

/** Plain-text site map for LLM crawlers (llms.txt convention). */
export async function GET() {
  const posts = getBlogPosts();
  const tags = getIndexableBlogTags();

  const lines = [
    `# ${SITE_NAME}`,
    "",
    `> ${SITE_DESCRIPTION}`,
    "",
    "## Product",
    `- Home: ${SITE_ORIGIN}/`,
    `- Pricing: ${SITE_ORIGIN}/pricing`,
    `- Sign up: ${SITE_ORIGIN}/signup`,
    `- Guides (topic index): ${SITE_ORIGIN}/guides`,
    `- Blog: ${SITE_ORIGIN}/blog`,
    `- Wall (shipped apps): ${SITE_ORIGIN}/wall`,
    "",
    "## Guides by topic",
    ...tags.map((tag) => `- ${tag}: ${SITE_ORIGIN}${blogTagPath(tag)}`),
    "",
    "## Blog posts",
    ...posts.map(
      (post) =>
        `- ${post.title}: ${SITE_ORIGIN}/blog/${post.slug}`,
    ),
    "",
    "## Legal",
    `- Privacy: ${SITE_ORIGIN}/privacy`,
    `- Terms: ${SITE_ORIGIN}/terms`,
    `- Contact: ${SITE_ORIGIN}/contact`,
    "",
    "## RSS",
    `- ${SITE_ORIGIN}/blog/rss.xml`,
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
