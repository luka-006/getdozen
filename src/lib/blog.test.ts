import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertBlogPostsValid,
  getBlogPost,
  getBlogPosts,
  relatedBlogPosts,
  renderBlogBody,
} from "./blog";

describe("blog", () => {
  it("has unique slugs, titles, and meta descriptions", () => {
    const posts = getBlogPosts();
    assert.equal(posts.length, 7);
    assert.doesNotThrow(() => assertBlogPostsValid(posts));
    for (const post of posts) {
      assert.match(post.body, /\[.+\]\(\/.+\)/);
    }
  });

  it("returns a post by slug and nothing for junk", () => {
    assert.equal(getBlogPost("why-12-testers")?.slug, "why-12-testers");
    assert.equal(getBlogPost("not-a-post"), null);
  });

  it("suggests related posts without repeating the current one", () => {
    const related = relatedBlogPosts("why-12-testers");
    assert.equal(related.length, 3);
    assert.equal(
      related.some((post) => post.slug === "why-12-testers"),
      false,
    );
  });

  it("renders headings and internal links", () => {
    const nodes = renderBlogBody(
      "## Hello\n\nRead the [board](/board) and **stay**.",
    );
    assert.equal(nodes.length, 2);
  });
});
