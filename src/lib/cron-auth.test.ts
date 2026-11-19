import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GET as runDailyCron } from "../app/api/cron/route";
import { GET as runCleanup } from "../app/api/cron/cleanup-retention/route";
import { GET as runSeed } from "../app/api/cron/seed-john-profile/route";
import { GET as runWaitlistLaunch } from "../app/api/cron/waitlist-launch/route";
import { cronAuthorized } from "./cron-auth";

const handlers = [runDailyCron, runCleanup, runSeed, runWaitlistLaunch];

function cronRequest(authorization?: string) {
  return new Request("http://localhost/api/cron", {
    method: "GET",
    headers: authorization ? { authorization } : {},
  });
}

describe("cron bearer auth", () => {
  const previous = process.env.CRON_SECRET;

  it("rejects a missing secret, a missing bearer, and a wrong bearer", async () => {
    try {
      delete process.env.CRON_SECRET;
      assert.equal(cronAuthorized(cronRequest("Bearer anything")), false);
      for (const handler of handlers) {
        const unset = await handler(cronRequest("Bearer anything"));
        assert.equal(unset.status, 401);
        assert.equal(await unset.text(), "");
      }

      process.env.CRON_SECRET = "cron-secret-value";
      const missing = await runDailyCron(cronRequest());
      assert.equal(missing.status, 401);
      const wrong = await runDailyCron(cronRequest("Bearer other-secret"));
      assert.equal(wrong.status, 401);
      const headerOnly = await runDailyCron(
        new Request("http://localhost/api/cron", {
          headers: {
            "x-cron-secret": "cron-secret-value",
            "x-vercel-cron": "1",
            "user-agent": "vercel-cron/1.0",
          },
        }),
      );
      assert.equal(headerOnly.status, 401);
    } finally {
      if (previous === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = previous;
    }
  });

  it("accepts the bearer and reaches the job", async () => {
    const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const previousKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    try {
      process.env.CRON_SECRET = "cron-secret-value";
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      assert.equal(cronAuthorized(cronRequest("Bearer cron-secret-value")), true);
      await assert.rejects(
        () => runDailyCron(cronRequest("Bearer cron-secret-value")),
        /Supabase admin credentials/,
      );
    } finally {
      if (previous === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = previous;
      if (previousUrl === undefined) delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      else process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
      if (previousKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      else process.env.SUPABASE_SERVICE_ROLE_KEY = previousKey;
    }
  });
});
