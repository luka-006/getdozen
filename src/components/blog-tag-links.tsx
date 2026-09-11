import Link from "next/link";
import { blogTagPath, isIndexableBlogTag } from "@/lib/blog";
import { blogTagLabel } from "@/lib/blog-tags";

export function BlogTagLinks({ tags }: { tags: string[] }) {
  if (!tags.length) return null;

  return (
    <ul className="mt-4 flex flex-wrap gap-2" aria-label="Topics">
      {tags.map((tag) => (
        <li key={tag}>
          {isIndexableBlogTag(tag) ? (
            <Link
              href={blogTagPath(tag)}
              className="pill text-[12px] hover:border-blue/40 hover:text-blue"
            >
              {blogTagLabel(tag)}
            </Link>
          ) : (
            <span className="pill text-[12px] text-ink/60">{blogTagLabel(tag)}</span>
          )}
        </li>
      ))}
    </ul>
  );
}
