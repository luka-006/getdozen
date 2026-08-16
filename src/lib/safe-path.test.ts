import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { safeInternalPath } from "./safe-path";

describe("safeInternalPath", () => {
  it("allows same-origin paths", () => {
    assert.equal(safeInternalPath("/wallet"), "/wallet");
    assert.equal(safeInternalPath("/board?type=tester"), "/board?type=tester");
  });

  it("rejects open redirects", () => {
    assert.equal(safeInternalPath("//evil.test"), "/board");
    assert.equal(safeInternalPath("https://evil.test"), "/board");
    assert.equal(safeInternalPath("/\\evil"), "/board");
    assert.equal(safeInternalPath("/%2f%2fevil.test"), "/board");
  });
});
