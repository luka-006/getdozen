import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isSeededShippedAppUrl, visibleShippedApps } from "./public-shipped";

describe("public shipped apps", () => {
  it("hides promo and preview seed urls", () => {
    assert.equal(
      isSeededShippedAppUrl("https://promo.getdozen.dev/focus-flow"),
      true,
    );
    assert.equal(
      isSeededShippedAppUrl("https://preview.example/apps/orbit-notes"),
      true,
    );
    assert.equal(isSeededShippedAppUrl("https://example.com/real"), false);
    const visible = visibleShippedApps([
      { app_name: "Seed", app_url: "https://promo.getdozen.dev/a" },
      { app_name: "Demo", app_url: "https://preview.example/apps/b" },
      { app_name: "Real", app_url: "https://shipped.example/app" },
    ]);
    assert.deepEqual(visible.map((row) => row.app_name), ["Real"]);
  });
});
