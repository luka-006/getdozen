import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { otpSendError } from "./auth-otp";

describe("otpSendError", () => {
  it("rewrites rate-limit copy", () => {
    assert.equal(
      otpSendError("For security purposes, you can only request this after 23 seconds."),
      "Wait a minute, then request a new code.",
    );
  });

  it("passes other errors through", () => {
    assert.equal(otpSendError("Invalid email"), "Invalid email");
  });
});
