import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogDateLabel } from "@/components/blog-json-ld";
import {
  getBlogPostsByTag,
  getIndexableBlogTags,
  blogTagPath,
} from "@/lib/blog";
import { BLOG_TAG_META, blogTagLabel } from "@/lib/blog-tags";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

type Params = { tag: string };

export function generateStaticParams() {
  return getIndexableBlogTags().map((tag) => ({ tag }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { tag } = await params;
  if (!getIndexableBlogTags().includes(tag)) {
    return pageMetadata({
      title: "Blog",
      description: "Dozen blog.",
      path: "/blog",
      index: false,
    });
  }
  const meta = BLOG_TAG_META[tag];
  const title = meta?.title ?? `${blogTagLabel(tag)} guides`;
  const description =
    meta?.description ??
    `Articles about ${blogTagLabel(tag)} for indie app and game makers on Dozen.`;
  return pageMetadata({
    title,
    description,
    path: blogTagPath(tag),
    keywords: [tag, "Dozen blog", "app testing", "indie launch"],
  });
}

export default async function BlogTagPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { tag } = await params;
  if (!getIndexableBlogTags().includes(tag)) notFound();

  const posts = getBlogPostsByTag(tag);
  const meta = BLOG_TAG_META[tag];
  const heading = meta?.label ?? blogTagLabel(tag);

  return (
    <div className="atmosphere">
      <div className="mx-auto w-full max-w-[720px] px-4 py-12">
        <p className="font-mono text-[12px] text-ink/50">
          <Link href="/blog" className="hover:text-blue">Blog</Link>
          {" · "}
          <Link href="/guides" className="hover:text-blue">Guides</Link>
        </p>
        <h1 className="mt-2 font-display text-[32px] font-semibold">{heading}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
          {meta?.description ??
            `Everything we have published on ${heading.toLowerCase()}.`}
        </p>

        <ul className="mt-10 space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="surface surface-hover px-5 py-5">
                <p className="font-mono text-[12px] text-ink/50">
                  {blogDateLabel(post)}
                </p>
                <h2 className="mt-2 font-display text-[22px] font-semibold">
                  <Link href={`/blog/${post.slug}`} className="hover:text-blue">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-[14px] leading-relaxed text-ink/70">
                  {post.description}
                </p>
              </article>
            </li>
          ))}
        </ul>

        <p className="mt-12 text-[13px] text-ink/60">
          <Link href="/guides" className="text-blue">All guides</Link>
          {" · "}
          <Link href="/blog" className="text-blue">Blog</Link>
          {" · "}
          <Link href="/signup" className="text-blue">Join Dozen</Link>
        </p>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: meta?.title ?? `${heading} guides`,
            description: meta?.description,
            url: absoluteUrl(blogTagPath(tag)),
            isPartOf: { "@id": `${absoluteUrl("/")}#website` },
            mainEntity: {
              "@type": "ItemList",
              itemListElement: posts.map((post, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: absoluteUrl(`/blog/${post.slug}`),
                name: post.title,
              })),
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
    </div>
  );
}
