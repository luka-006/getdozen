import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyEarlyAccess,
  resetEarlyAccessRateLimit,
  signEarlyAccessToken,
  type EarlyAccessStore,
} from "./early-access";
import { evaluateRequest } from "./waitlist-lock";

const SECRET = "waitlist-early-access-test";
const ROW = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";

function memoryStore() {
  const rows = new Map<string, { at: string }>();
  let writes = 0;
  const known = new Set([ROW, OTHER]);
  const store: EarlyAccessStore = {
    async flag(id, atIso) {
      writes += 1;
      if (!known.has(id)) return "missing";
      const current = rows.get(id);
      if (current) return "already";
      rows.set(id, { at: atIso });
      return "set";
    },
  };
  return { store, rows, writes: () => writes };
}

describe("early access flag", () => {
  it("sets the flag once and leaves the timestamp alone on repeat", async () => {
    resetEarlyAccessRateLimit();
    const db = memoryStore();
    const token = await signEarlyAccessToken(SECRET, ROW, 0);
    const first = await applyEarlyAccess({
      token,
      secret: SECRET,
      nowMs: 1_000,
      ip: "203.0.113.10",
      store: db.store,
    });
    assert.equal(first.ok, true);
    const stamped = db.rows.get(ROW)?.at;
    assert.equal(stamped, new Date(1_000).toISOString());

    const again = await applyEarlyAccess({
      token,
      secret: SECRET,
      nowMs: 50_000,
      ip: "203.0.113.11",
      store: db.store,
    });
    assert.equal(again.ok, true);
    assert.equal(db.rows.get(ROW)?.at, stamped);
    assert.equal(db.writes(), 2);
  });

  it("rejects a missing, invalid, or expired token and writes nothing", async () => {
    resetEarlyAccessRateLimit();
    const db = memoryStore();
    const token = await signEarlyAccessToken(SECRET, ROW, 0);
    const expired = await signEarlyAccessToken(SECRET, ROW, 0);
    const cases: Array<string | null> = [
      null,
      "",
      "v1.not-a-uuid.9999999999.sig",
      token.slice(0, -4) + "xxxx",
      expired,
      token.replace(ROW, OTHER),
    ];
    for (const [index, bad] of cases.entries()) {
      const nowMs = bad === expired ? 30 * 60 * 1000 : 1_000;
      const result = await applyEarlyAccess({
        token: bad,
        secret: SECRET,
        nowMs,
        ip: `203.0.113.${20 + index}`,
        store: db.store,
      });
      assert.equal(result.ok, false);
    }
    const missingSecret = await applyEarlyAccess({
      token,
      secret: null,
      nowMs: 1_000,
      ip: "203.0.113.40",
      store: db.store,
    });
    assert.equal(missingSecret.ok, false);
    assert.equal(db.writes(), 0);
    assert.equal(db.rows.size, 0);
  });

  it("keeps product routes blocked while the homepage can post the action", () => {
    const blocked = evaluateRequest({
      launchOpen: false,
      pathname: "/board",
      method: "POST",
      production: true,
      adminConsolePath: "/ops-secret",
    });
    const home = evaluateRequest({
      launchOpen: false,
      pathname: "/",
      method: "POST",
      production: true,
      adminConsolePath: "/ops-secret",
    });
    const confirmed = evaluateRequest({
      launchOpen: false,
      pathname: "/waitlist/confirmed",
      method: "POST",
      production: true,
      adminConsolePath: "/ops-secret",
    });
    assert.equal(blocked.kind, "not-found");
    assert.equal(home.kind, "next");
    assert.equal(confirmed.kind, "next");
  });
});
