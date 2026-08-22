import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SITE_ORIGIN,
  isAllowedAppHost,
  resolveRequestOrigin,
} from "./app-url";

function requestWith(url: string, headers: Record<string, string> = {}) {
  return new Request(url, { headers });
}

describe("isAllowedAppHost", () => {
  it("allows production and local hosts", () => {
    assert.equal(isAllowedAppHost("getdozen.dev"), true);
    assert.equal(isAllowedAppHost("www.getdozen.dev"), true);
    assert.equal(isAllowedAppHost("localhost:3000"), true);
    assert.equal(isAllowedAppHost("127.0.0.1:3000"), true);
    assert.equal(isAllowedAppHost("getdozen-abc.vercel.app"), true);
  });

  it("rejects unknown hosts", () => {
    assert.equal(isAllowedAppHost("evil.example"), false);
  });
});

describe("resolveRequestOrigin", () => {
  it("keeps localhost so OAuth cookies stay on the same host", () => {
    assert.equal(
      resolveRequestOrigin(requestWith("http://localhost:3000/auth/google")),
      "http://localhost:3000",
    );
  });

  it("uses the forwarded production host", () => {
    assert.equal(
      resolveRequestOrigin(
        requestWith("http://localhost/auth/callback", {
          "x-forwarded-host": "getdozen.dev",
          "x-forwarded-proto": "https",
        }),
      ),
      "https://getdozen.dev",
    );
  });

  it("falls back to the canonical origin for unknown hosts", () => {
    assert.equal(
      resolveRequestOrigin(requestWith("https://evil.example/login")),
      SITE_ORIGIN,
    );
  });
});
