import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_ORIGIN } from "./app-url";
import {
  ROBOTS_DISALLOW,
  SITEMAP_PATHS,
  SITE_NAME,
  absoluteUrl,
  isPublicSeoPath,
} from "./seo";

describe("seo crawl files", () => {
  it("canonicalizes to getdozen.dev, not vercel.app", () => {
    assert.equal(SITE_ORIGIN, "https://getdozen.dev");
    assert.equal(absoluteUrl("/"), SITE_ORIGIN);
    assert.equal(absoluteUrl("/pricing"), "https://getdozen.dev/pricing");
    assert.equal(SITE_NAME, "Dozen");
  });

  it("sitemaps public marketing and legal pages only", () => {
    const paths = SITEMAP_PATHS.map((entry) => entry.path);
    assert.deepEqual(paths, [
      "/",
      "/pricing",
      "/blog",
      "/wall",
      "/legal",
      "/privacy",
      "/terms",
      "/terms/payment",
      "/cookies",
    ]);
  });

  it("does not index auth, admin, wallet, api, or waitlist internals", () => {
    const blocked = [
      "/login",
      "/signup",
      "/auth/",
      "/admin",
      "/wallet",
      "/api/",
      "/waitlist/",
      "/board",
      "/testers",
      "/setup",
    ];
    for (const path of blocked) {
      assert.ok(
        ROBOTS_DISALLOW.includes(path),
        `expected robots to disallow ${path}`,
      );
    }
    const publicPaths = new Set(SITEMAP_PATHS.map((entry) => entry.path));
    for (const path of blocked) {
      assert.equal(publicPaths.has(path), false);
    }
  });

  it("treats crawl files as public", () => {
    for (const path of [
      "/robots.txt",
      "/sitemap.xml",
      "/favicon.ico",
      "/icon",
      "/icon-96.png",
      "/apple-icon",
      "/opengraph-image",
    ]) {
      assert.equal(isPublicSeoPath(path), true);
    }
    assert.equal(isPublicSeoPath("/login"), false);
  });
});
