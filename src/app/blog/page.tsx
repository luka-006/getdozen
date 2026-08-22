import Link from "next/link";
import {
  BlogIndexJsonLd,
  blogDateLabel,
} from "@/components/blog-json-ld";
import { getBlogPosts } from "@/lib/blog";
import { pageMetadata } from "@/lib/seo";

export const metadata = {
  ...pageMetadata({
    title: "Blog",
    description:
      "Human notes on 12 testers, closed tests, and structured app feedback — written for indie makers who actually ship.",
    path: "/blog",
  }),
  alternates: {
    canonical: "/blog",
    types: {
      "application/rss+xml": "/blog/rss.xml",
    },
  },
};

export default function BlogIndexPage() {
  const posts = getBlogPosts();

  return (
    <div className="atmosphere">
      <BlogIndexJsonLd posts={posts} />
      <div className="mx-auto w-full max-w-[720px] px-4 py-12">
        <p className="font-mono text-[12px] text-ink/50">Blog</p>
        <h1 className="mt-2 font-display text-[32px] font-semibold">
          Testers, feedback, closed tests
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/70">
          Short essays from Dozen. How many testers to use, how to ask them
          anything useful, and what to do with the pile of notes after.{" "}
          <a className="text-blue" href="/blog/rss.xml">
            RSS
          </a>
        </p>

        <ul className="mt-10 space-y-6">
          {posts.map((post) => (
            <li key={post.slug}>
              <article className="surface px-5 py-5">
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
                <p className="mt-3">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-[13px] text-blue"
                  >
                    Read
                  </Link>
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
