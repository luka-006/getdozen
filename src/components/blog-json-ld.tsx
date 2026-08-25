import { SITE_ORIGIN } from "@/lib/app-url";
import {
  type BlogPost,
  blogUrl,
  formatBlogDate,
} from "@/lib/blog";
import { LEGAL } from "@/lib/legal";
import { SITE_NAME } from "@/lib/seo";

function jsonScript(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function BlogIndexJsonLd({ posts }: { posts: BlogPost[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} blog`,
    url: `${SITE_ORIGIN}/blog`,
    description:
      "Notes on testers, closed tests, and structured feedback for indie apps.",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/icon-96.png`,
    },
    isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: blogUrl(post.slug),
      datePublished: post.publishedAt,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonScript(jsonLd) }}
    />
  );
}

export function BlogPostJsonLd({ post }: { post: BlogPost }) {
  const url = blogUrl(post.slug);
  const graph: unknown[] = [
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: SITE_ORIGIN,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: `${SITE_ORIGIN}/blog`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.title,
          item: url,
        },
      ],
    },
    {
      "@type": "BlogPosting",
      headline: post.title,
      description: post.description,
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
      dateCreated: post.publishedAt,
      inLanguage: "en",
      mainEntityOfPage: url,
      image: `${SITE_ORIGIN}/opengraph-image`,
      wordCount: post.body.trim().split(/\s+/).length,
      author: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_ORIGIN,
        email: LEGAL.email,
      },
      publisher: {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_ORIGIN,
        logo: `${SITE_ORIGIN}/icon.svg`,
      },
      keywords: post.tags.join(", "),
    },
  ];

  if (post.faq?.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: post.faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    });
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonScript({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}

export function blogDateLabel(post: BlogPost) {
  const published = formatBlogDate(post.publishedAt);
  if (post.updatedAt !== post.publishedAt) {
    return `${published} · updated ${formatBlogDate(post.updatedAt)}`;
  }
  return published;
}
