import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { SITE_ORIGIN } from "./app-url";
import {
  ROBOTS_DISALLOW,
  SITEMAP_PATHS,
  SITE_HOME_TITLE,
  SITE_NAME,
  absoluteUrl,
  isPublicSeoPath,
  pageMetadata,
} from "./seo";

describe("seo crawl files", () => {
  it("canonicalizes to getdozen.dev, not vercel.app", () => {
    assert.equal(SITE_ORIGIN, "https://getdozen.dev");
    assert.equal(absoluteUrl("/"), SITE_ORIGIN);
    assert.equal(absoluteUrl("/pricing"), "https://getdozen.dev/pricing");
    assert.equal(SITE_NAME, "Dozen");
    assert.equal(SITE_HOME_TITLE, "Dozen");
  });

  it("keeps home title as Dozen without a subtitle suffix", () => {
    const home = pageMetadata({
      title: SITE_HOME_TITLE,
      description: "desc",
      path: "/",
      absoluteTitle: true,
    });
    assert.deepEqual(home.title, { absolute: "Dozen" });
    assert.equal(home.openGraph?.title, "Dozen");
    assert.equal(home.twitter?.title, "Dozen");

    const board = pageMetadata({
      title: "Board",
      description: "desc",
      path: "/board",
    });
    assert.equal(board.title, "Board");
  });

  it("sitemaps public marketing and legal pages only", () => {
    const paths = SITEMAP_PATHS.map((entry) => entry.path);
    assert.deepEqual(paths, [
      "/",
      "/blog",
      "/guides",
      "/wall",
      "/contact",
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
      "/admin-console",
      "/wallet",
      "/pricing",
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
