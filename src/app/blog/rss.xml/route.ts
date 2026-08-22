import { SITE_ORIGIN } from "@/lib/app-url";
import { blogUrl, getBlogPosts } from "@/lib/blog";
import { SITE_NAME } from "@/lib/seo";

function xmlEscape(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const posts = getBlogPosts();
  const items = posts
    .map((post) => {
      const url = blogUrl(post.slug);
      return `    <item>
      <title>${xmlEscape(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <pubDate>${new Date(`${post.publishedAt}T08:00:00+02:00`).toUTCString()}</pubDate>
      <description>${xmlEscape(post.description)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(`${SITE_NAME} blog`)}</title>
    <link>${SITE_ORIGIN}/blog</link>
    <description>Testers, closed tests, and structured feedback for indie apps.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
