import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BlogPostJsonLd,
  blogDateLabel,
} from "@/components/blog-json-ld";
import {
  getBlogPost,
  getBlogPosts,
  relatedBlogPosts,
  renderBlogBody,
} from "@/lib/blog";
import { absoluteUrl, pageMetadata } from "@/lib/seo";

type Params = { slug: string };

export function generateStaticParams() {
  return getBlogPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return pageMetadata({ title: "Blog", description: "Dozen blog.", path: "/blog", index: false });
  return {
    ...pageMetadata({
      title: post.title,
      description: post.description,
      path: `/blog/${post.slug}`,
      keywords: [...post.tags, "Dozen blog", "app testing"],
    }),
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      url: absoluteUrl(`/blog/${post.slug}`),
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      tags: post.tags,
      siteName: "Dozen",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const related = relatedBlogPosts(post.slug);

  return (
    <div className="atmosphere">
      <BlogPostJsonLd post={post} />
      <article className="mx-auto w-full max-w-[720px] px-4 py-12">
        <p className="font-mono text-[12px] text-ink/50">
          <Link href="/blog" className="hover:text-blue">
            Blog
          </Link>
          {" · "}
          {blogDateLabel(post)}
        </p>
        <h1 className="mt-3 font-display text-[32px] font-semibold leading-tight">
          {post.title}
        </h1>
        <p className="mt-4 text-[16px] leading-relaxed text-ink/70">
          {post.description}
        </p>
        <div className="blog-prose mt-8 space-y-6 text-[15px] leading-relaxed text-ink/85">
          {renderBlogBody(post.body)}
        </div>

        {post.faq?.length ? (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="font-display text-[20px] font-semibold">
              Quick answers
            </h2>
            <dl className="mt-4 space-y-5">
              {post.faq.map((item) => (
                <div key={item.question}>
                  <dt className="font-medium text-ink">{item.question}</dt>
                  <dd className="mt-1 text-[14px] leading-relaxed text-ink/75">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {related.length ? (
          <nav className="mt-12 border-t border-border pt-8">
            <p className="font-display text-[20px] font-semibold">Keep reading</p>
            <ul className="mt-4 space-y-3">
              {related.map((item) => (
                <li key={item.slug}>
                  <Link href={`/blog/${item.slug}`} className="text-blue">
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <p className="mt-12 text-[13px] text-ink/60">
          <Link href="/pricing" className="text-blue">
            Pricing
          </Link>
          {" · "}
          <Link href="/signup" className="text-blue">
            Join Dozen
          </Link>
          {" · "}
          <Link href="/blog" className="text-blue">
            All posts
          </Link>
        </p>
      </article>
    </div>
  );
}
