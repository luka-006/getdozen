import Link from "next/link";
import { createElement, type ReactNode } from "react";
import { posts } from "@/content/blog/posts";
import { SITE_ORIGIN } from "@/lib/app-url";

export type BlogFaq = { question: string; answer: string };

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  faq?: BlogFaq[];
  body: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getBlogPosts(): BlogPost[] {
  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getBlogPost(slug: string): BlogPost | null {
  return posts.find((post) => post.slug === slug) ?? null;
}

export function relatedBlogPosts(slug: string, limit = 3): BlogPost[] {
  const current = getBlogPost(slug);
  if (!current) return getBlogPosts().slice(0, limit);
  const scored = getBlogPosts()
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score: post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .sort((a, b) => b.score - a.score || b.post.publishedAt.localeCompare(a.post.publishedAt));
  return scored.slice(0, limit).map((entry) => entry.post);
}

export function blogPath(slug: string) {
  return `/blog/${slug}`;
}

export function blogUrl(slug: string) {
  return `${SITE_ORIGIN}${blogPath(slug)}`;
}

export function formatBlogDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function assertBlogPostsValid(all: BlogPost[]) {
  const slugs = new Set<string>();
  for (const post of all) {
    if (!SLUG.test(post.slug)) {
      throw new Error(`Invalid blog slug: ${post.slug}`);
    }
    if (slugs.has(post.slug)) {
      throw new Error(`Duplicate blog slug: ${post.slug}`);
    }
    slugs.add(post.slug);
    if (post.title.length < 20 || post.title.length > 80) {
      throw new Error(`Title length off for ${post.slug}`);
    }
    if (post.description.length < 110 || post.description.length > 170) {
      throw new Error(`Description length off for ${post.slug}`);
    }
    if (!post.body.includes("\n## ")) {
      throw new Error(`Missing headings in ${post.slug}`);
    }
  }
}

function hrefAllowed(href: string) {
  return href.startsWith("/") || href.startsWith("https://");
}

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      nodes.push(text.slice(last, match.index));
    }
    if (match[1]) {
      nodes.push(
        createElement("strong", { key: `${keyPrefix}-b-${i}` }, match[1]),
      );
    } else if (match[2] && match[3] && hrefAllowed(match[3])) {
      const href = match[3];
      const label = match[2];
      if (href.startsWith("/")) {
        nodes.push(
          createElement(
            Link,
            { key: `${keyPrefix}-a-${i}`, href, className: "text-blue" },
            label,
          ),
        );
      } else {
        nodes.push(
          createElement(
            "a",
            {
              key: `${keyPrefix}-a-${i}`,
              href,
              className: "text-blue",
              rel: "noreferrer",
            },
            label,
          ),
        );
      }
    } else {
      nodes.push(match[0]);
    }
    last = match.index + match[0].length;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isList(line: string, ordered: boolean) {
  return ordered ? /^\d+\.\s+/.test(line) : /^-\s+/.test(line);
}

function listItemText(line: string, ordered: boolean) {
  return ordered ? line.replace(/^\d+\.\s+/, "") : line.replace(/^-\s+/, "");
}

export function renderBlogBody(markdown: string): ReactNode[] {
  const blocks = markdown.trim().split(/\n{2,}/);
  const nodes: ReactNode[] = [];

  for (let b = 0; b < blocks.length; b += 1) {
    const block = blocks[b].trim();
    if (!block) continue;

    if (block.startsWith("### ")) {
      nodes.push(
        createElement(
          "h3",
          { key: `h3-${b}`, className: "font-display text-[18px] font-semibold text-ink" },
          renderInline(block.slice(4), `h3-${b}`),
        ),
      );
      continue;
    }

    if (block.startsWith("## ")) {
      nodes.push(
        createElement(
          "h2",
          { key: `h2-${b}`, className: "font-display text-[20px] font-semibold text-ink" },
          renderInline(block.slice(3), `h2-${b}`),
        ),
      );
      continue;
    }

    const lines = block.split("\n");
    const unordered = lines.every((line) => isList(line, false));
    const ordered = lines.every((line) => isList(line, true));
    if (unordered || ordered) {
      nodes.push(
        createElement(
          ordered ? "ol" : "ul",
          {
            key: `l-${b}`,
            className: ordered
              ? "list-decimal space-y-2 pl-5"
              : "list-disc space-y-2 pl-5",
          },
          lines.map((line, i) =>
            createElement(
              "li",
              { key: `l-${b}-${i}` },
              renderInline(listItemText(line, ordered), `l-${b}-${i}`),
            ),
          ),
        ),
      );
      continue;
    }

    nodes.push(
      createElement(
        "p",
        { key: `p-${b}` },
        renderInline(block.replace(/\n/g, " "), `p-${b}`),
      ),
    );
  }

  return nodes;
}
