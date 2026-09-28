import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { testerCompletionPageUrl } from "./tester-completion-mail";

describe("testerCompletionPageUrl", () => {
  it("builds the post-completion feedback URL", () => {
    const url = testerCompletionPageUrl(
      "82b16889-909d-496b-afc8-a7580f4b64ad",
    );
    assert.equal(
      url,
      "https://getdozen.dev/testers/complete/82b16889-909d-496b-afc8-a7580f4b64ad",
    );
  });
});
