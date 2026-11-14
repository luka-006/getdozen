import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  guardLoginRedirect,
  launchSessionRedirect,
} from "./middleware-auth";
import {
  evaluateRequest,
  inviteCodeMatches,
  isAllowlistedAdminEmail,
  normalizeLockPath,
  signInviteCookie,
  verifyInviteCookie,
  type LockHeaders,
} from "./waitlist-lock";

const emptyHeaders: LockHeaders = {};

function decide(
  pathname: string,
  opts: {
    launchOpen?: boolean;
    method?: string;
    headers?: LockHeaders;
    unlocked?: boolean;
    production?: boolean;
  } = {},
) {
  return evaluateRequest({
    launchOpen: opts.launchOpen ?? false,
    pathname,
    method: opts.method ?? "GET",
    headers: opts.headers ?? emptyHeaders,
    unlocked: opts.unlocked ?? false,
    production: opts.production ?? true,
    adminConsolePath: "/ops-secret",
  });
}

describe("normalizeLockPath", () => {
  it("decodes, lowercases, and collapses slashes", () => {
    assert.equal(normalizeLockPath("/Board/"), "/board");
    assert.equal(normalizeLockPath("//login///"), "/login");
    assert.equal(normalizeLockPath("/LOGIN/Forgot/"), "/login/forgot");
    assert.equal(normalizeLockPath("/board%2Fsecret"), "/board/secret");
    assert.equal(normalizeLockPath("/foo/%252e%252e/board"), "/board");
    assert.equal(normalizeLockPath("/board/../login"), "/login");
    assert.equal(normalizeLockPath("/%2e%2e/board"), "/board");
    assert.equal(normalizeLockPath("/requests\\new"), "/requests/new");
    assert.equal(normalizeLockPath("/"), "/");
  });
});

describe("waitlist mode", () => {
  const blocked = [
    ["/board", "GET"],
    ["/Board/", "GET"],
    ["/BOARD", "HEAD"],
    ["/rooms", "GET"],
    ["/reviews", "GET"],
    ["/reviews/abc", "GET"],
    ["/profile/user-1", "GET"],
    ["/requests/new", "GET"],
    ["/requests/abc", "POST"],
    ["/login", "GET"],
    ["/login/", "GET"],
    ["/login/forgot", "GET"],
    ["/signup", "GET"],
    ["/signup/confirm", "GET"],
    ["/wall", "GET"],
    ["/wall/new", "GET"],
    ["/blog", "GET"],
    ["/blog/why-12-testers", "GET"],
    ["/guides", "GET"],
    ["/pricing", "GET"],
    ["/wallet", "GET"],
    ["/contact", "GET"],
    ["/legal", "GET"],
    ["/terms/payment", "GET"],
    ["/api/cron", "GET"],
    ["/api/cron", "POST"],
    ["/api/stripe/webhook", "POST"],
    ["/api/resend/inbound", "POST"],
    ["/api/admin/award-bug", "POST"],
    ["/_next/data/build/board.json", "GET"],
    ["/llms.txt", "GET"],
    ["/setup", "GET"],
    ["/admin", "GET"],
    ["/admin-console", "GET"],
    ["/ops-secret", "GET"],
    ["/invite", "GET"],
    ["/invite/not a code", "GET"],
    ["/invite/../board", "GET"],
  ] as const;

  for (const [pathname, method] of blocked) {
    it(`404 ${method} ${pathname}`, () => {
      assert.equal(decide(pathname, { method }).kind, "not-found");
    });
  }

  const allowed = [
    ["/", "GET"],
    ["/", "HEAD"],
    ["/", "POST"],
    ["/privacy", "GET"],
    ["/terms", "GET"],
    ["/cookies", "GET"],
    ["/waitlist/confirmed", "GET"],
    ["/waitlist/confirmed", "POST"],
    ["/auth/confirm", "GET"],
    ["/auth/confirm", "POST"],
    ["/auth/callback", "GET"],
    ["/favicon.ico", "GET"],
    ["/opengraph-image", "GET"],
    ["/robots.txt", "GET"],
    ["/sitemap.xml", "GET"],
    ["/_next/static/chunks/app.js", "GET"],
    ["/_next/image", "GET"],
    ["/marketing/phones/desktop/testers/000.webp", "GET"],
    ["/icon-96.png", "GET"],
  ] as const;

  for (const [pathname, method] of allowed) {
    it(`allows ${method} ${pathname}`, () => {
      assert.equal(decide(pathname, { method }).kind, "next");
    });
  }

  it("does not allow POST on legal or callback pages", () => {
    assert.equal(decide("/privacy", { method: "POST" }).kind, "not-found");
    assert.equal(decide("/auth/callback", { method: "POST" }).kind, "not-found");
    assert.equal(decide("/robots.txt", { method: "POST" }).kind, "not-found");
  });

  it("404s HEAD and OPTIONS on product routes", () => {
    assert.equal(decide("/board", { method: "HEAD" }).kind, "not-found");
    assert.equal(decide("/login", { method: "OPTIONS" }).kind, "not-found");
    assert.equal(decide("/api/cron", { method: "OPTIONS" }).kind, "not-found");
    assert.equal(decide("/", { method: "OPTIONS" }).kind, "next");
  });

  it("does not let RSC, prefetch, or Next-Action headers unlock a route", () => {
    const headers: LockHeaders = {
      rsc: "1",
      prefetch: "1",
      nextAction: "abc",
      middlewareSubrequest: "middleware:middleware:middleware:middleware:middleware",
    };
    assert.equal(decide("/board", { headers }).kind, "not-found");
    assert.equal(
      decide("/requests/new", { method: "POST", headers }).kind,
      "not-found",
    );
    assert.equal(decide("/board?_rsc=1", { headers }).kind, "not-found");
    assert.equal(decide("/", { headers }).kind, "next");
    assert.equal(decide("/", { method: "POST", headers }).kind, "next");
  });

  it("does not treat a session as a bypass unless unlocked is set", () => {
    assert.equal(decide("/board").kind, "not-found");
    assert.equal(decide("/board", { unlocked: true }).kind, "session");
    assert.equal(decide("/login", { unlocked: true }).kind, "session");
    assert.equal(decide("/", { unlocked: true }).kind, "next");
  });

  it("returns the invite code for a well-formed link and 404s junk", () => {
    assert.deepEqual(decide("/invite/dozen-early"), {
      kind: "invite",
      code: "dozen-early",
    });
    assert.deepEqual(decide("/Invite/Friend-42/"), {
      kind: "invite",
      code: "friend-42",
    });
    assert.equal(decide("/invite/bad code").kind, "not-found");
    assert.equal(decide("/invite/dozen-early", { method: "POST" }).kind, "not-found");
  });

  it("404s /setup instead of redirecting", () => {
    assert.equal(decide("/setup").kind, "not-found");
  });
});

describe("open mode", () => {
  it("does not 404 product, auth, or api routes", () => {
    assert.equal(decide("/board", { launchOpen: true }).kind, "session");
    assert.equal(decide("/login", { launchOpen: true }).kind, "session");
    assert.equal(decide("/login/", { launchOpen: true }).kind, "session");
    assert.equal(decide("/Login/", { launchOpen: true }).kind, "session");
    assert.equal(decide("/signup", { launchOpen: true }).kind, "session");
    assert.equal(decide("/requests/new", { launchOpen: true }).kind, "session");
    assert.equal(decide("/", { launchOpen: true }).kind, "next");
    assert.equal(decide("/blog/why-12-testers", { launchOpen: true }).kind, "next");
    assert.equal(decide("/wall", { launchOpen: true }).kind, "next");
    assert.equal(decide("/api/cron", { launchOpen: true }).kind, "next");
    assert.equal(decide("/api/stripe/webhook", { launchOpen: true, method: "POST" }).kind, "next");
    assert.equal(decide("/profile/abc", { launchOpen: true }).kind, "next");
  });

  it("keeps the signed-out /login settlement from the redirect-loop fix", () => {
    assert.equal(decide("/login", { launchOpen: true }).kind, "session");
    assert.equal(decide("/signup", { launchOpen: true }).kind, "session");
    assert.equal(
      guardLoginRedirect("/login", launchSessionRedirect("/login", false)),
      null,
    );
    assert.equal(
      guardLoginRedirect("/signup", launchSessionRedirect("/signup", false)),
      null,
    );
    assert.deepEqual(launchSessionRedirect("/board", false), {
      pathname: "/login",
      next: "/board",
    });
  });

  it("still hides legacy admin paths and rewrites the console", () => {
    assert.equal(decide("/admin", { launchOpen: true }).kind, "not-found");
    assert.equal(decide("/admin-console/gate", { launchOpen: true }).kind, "not-found");
    assert.deepEqual(decide("/ops-secret", { launchOpen: true }), {
      kind: "rewrite",
      pathname: "/admin-console",
    });
    assert.deepEqual(decide("/ops-secret/gate", { launchOpen: true }), {
      kind: "rewrite",
      pathname: "/admin-console/gate",
    });
  });

  it("redirects /setup to /board in production and looks up a session otherwise", () => {
    assert.deepEqual(decide("/setup", { launchOpen: true, production: true }), {
      kind: "redirect",
      pathname: "/board",
    });
    assert.equal(
      decide("/setup", { launchOpen: true, production: false }).kind,
      "session",
    );
  });

  it("ignores the middleware subrequest header", () => {
    assert.equal(
      decide("/board", {
        launchOpen: true,
        headers: { middlewareSubrequest: "1" },
      }).kind,
      "session",
    );
  });
});

describe("invite cookie and admin emails", () => {
  const secret = "test-invite-secret-value";

  it("round-trips a signed cookie and rejects tampering", async () => {
    const token = await signInviteCookie(secret, 1_700_000_000_000);
    assert.equal(await verifyInviteCookie(token, secret, 1_700_000_000_000), true);
    assert.equal(
      await verifyInviteCookie(token, secret, 1_700_000_000_000 + 31 * 24 * 60 * 60 * 1000),
      false,
    );
    assert.equal(await verifyInviteCookie(`${token}x`, secret, 1_700_000_000_000), false);
    assert.equal(await verifyInviteCookie(token, "another-secret-value", 1_700_000_000_000), false);
    assert.equal(await verifyInviteCookie(token, null, 1_700_000_000_000), false);
  });

  it("matches invite codes case-insensitively and ignores empty config", () => {
    const previous = process.env.INVITE_CODES;
    process.env.INVITE_CODES = "Dozen-Early, friend-42";
    assert.equal(inviteCodeMatches("dozen-early"), true);
    assert.equal(inviteCodeMatches("FRIEND-42"), true);
    assert.equal(inviteCodeMatches("nope"), false);
    process.env.INVITE_CODES = "";
    assert.equal(inviteCodeMatches("dozen-early"), false);
    if (previous === undefined) delete process.env.INVITE_CODES;
    else process.env.INVITE_CODES = previous;
  });

  it("reads ADMIN_EMAILS and ADMIN_OWNER_EMAIL", () => {
    const previousEmails = process.env.ADMIN_EMAILS;
    const previousOwner = process.env.ADMIN_OWNER_EMAIL;
    process.env.ADMIN_EMAILS = "One@Example.com, two@example.com";
    process.env.ADMIN_OWNER_EMAIL = "owner@getdozen.dev";
    assert.equal(isAllowlistedAdminEmail("one@example.com"), true);
    assert.equal(isAllowlistedAdminEmail("TWO@example.com"), true);
    assert.equal(isAllowlistedAdminEmail("owner@getdozen.dev"), true);
    assert.equal(isAllowlistedAdminEmail("stranger@example.com"), false);
    assert.equal(isAllowlistedAdminEmail(null), false);
    if (previousEmails === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = previousEmails;
    if (previousOwner === undefined) delete process.env.ADMIN_OWNER_EMAIL;
    else process.env.ADMIN_OWNER_EMAIL = previousOwner;
  });
});
