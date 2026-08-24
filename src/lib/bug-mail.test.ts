import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bugAwardAdminUrl, bugAwardClickUrl } from "./bug-award-token";
import { bugMailBrowserPayload, parseBugReport } from "./bug-mail";

describe("parseBugReport", () => {
  it("accepts a complete report", () => {
    const form = new FormData();
    form.set("summary", "Board filter does not stick");
    form.set("details", "I chose UX then refreshed and it reset.");
    form.set("email", "maker@example.com");
    form.set("page", "/board?type=feedback");
    const parsed = parseBugReport(form);
    assert.equal("error" in parsed, false);
    if (!("error" in parsed)) {
      assert.equal(parsed.summary.startsWith("Board"), true);
    }
  });

  it("rejects a too-short summary", () => {
    const form = new FormData();
    form.set("summary", "bug");
    form.set("details", "This is enough detail for the form.");
    form.set("page", "/board");
    const parsed = parseBugReport(form);
    assert.equal("error" in parsed, true);
  });

  it("defaults a missing page to /", () => {
    const form = new FormData();
    form.set("summary", "Something broke on login");
    form.set("details", "The Google button did nothing.");
    const parsed = parseBugReport(form);
    assert.equal("error" in parsed, false);
    if (!("error" in parsed)) {
      assert.equal(parsed.page, "/");
    }
  });

  it("builds a browser mail payload after a valid report", () => {
    const award =
      "https://getdozen.dev/api/admin/award-bug?bug=82b16889-909d-496b-afc8-a7580f4b64ad&sig=abc";
    const payload = bugMailBrowserPayload(
      {
        summary: "Board filter does not stick",
        details: "I chose UX then refreshed and it reset.",
        email: "maker@example.com",
        page: "/board",
      },
      award,
    );
    assert.equal(payload.url.includes("formsubmit.co/ajax/"), true);
    assert.equal(payload.body.page, "/board");
    assert.equal(payload.body.email, "maker@example.com");
    assert.equal(payload.body.Award, award);
  });

  it("builds a signed Award click URL when secret is set", () => {
    process.env.CRON_SECRET = "test-secret";
    const url = bugAwardClickUrl("82b16889-909d-496b-afc8-a7580f4b64ad");
    assert.equal(url.includes("/api/admin/award-bug?"), true);
    assert.equal(url.includes("sig="), true);
    delete process.env.CRON_SECRET;
  });

  it("builds an admin Award URL", () => {
    const url = bugAwardAdminUrl("82b16889-909d-496b-afc8-a7580f4b64ad");
    assert.equal(url.includes("/admin?bug=82b16889-909d-496b-afc8-a7580f4b64ad"), true);
    assert.equal(url.endsWith("#award"), true);
  });

  it("rejects an open redirect in the page field", () => {
    const form = new FormData();
    form.set("summary", "Something broke on login");
    form.set("details", "The Google button did nothing.");
    form.set("page", "https://evil.example");
    const parsed = parseBugReport(form);
    assert.equal("error" in parsed, true);
  });
});
