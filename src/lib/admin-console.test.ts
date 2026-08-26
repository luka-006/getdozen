import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAdminSessionToken,
  parseAdminSessionToken,
} from "./admin-console";
import {
  adminConsolePath,
  isAdminConsoleInternalPath,
  isLegacyAdminPath,
} from "./admin-console-path";

describe("admin console paths", () => {
  it("blocks legacy and internal admin URLs", () => {
    assert.equal(isLegacyAdminPath("/admin"), true);
    assert.equal(isLegacyAdminPath("/admin/foo"), true);
    assert.equal(isAdminConsoleInternalPath("/admin-console"), true);
    assert.equal(isAdminConsoleInternalPath("/admin-console/gate"), true);
    assert.equal(isLegacyAdminPath("/board"), false);
  });

  it("uses ADMIN_CONSOLE_PATH when set", () => {
    process.env.ADMIN_CONSOLE_PATH = "/ops-luka-9k2";
    assert.equal(adminConsolePath(), "/ops-luka-9k2");
    delete process.env.ADMIN_CONSOLE_PATH;
  });
});

describe("admin console session", () => {
  it("round-trips a signed session token", () => {
    process.env.ADMIN_SESSION_SECRET = "test-session-secret";
    const token = createAdminSessionToken("82b16889-909d-496b-afc8-a7580f4b64ad");
    const parsed = parseAdminSessionToken(token);
    assert.equal(parsed?.uid, "82b16889-909d-496b-afc8-a7580f4b64ad");
    delete process.env.ADMIN_SESSION_SECRET;
  });

  it("rejects tampered tokens", () => {
    process.env.ADMIN_SESSION_SECRET = "test-session-secret";
    const token = createAdminSessionToken("82b16889-909d-496b-afc8-a7580f4b64ad");
    const parsed = parseAdminSessionToken(`${token}x`);
    assert.equal(parsed, null);
    delete process.env.ADMIN_SESSION_SECRET;
  });
});
