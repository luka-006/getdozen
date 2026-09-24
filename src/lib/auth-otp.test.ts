import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { otpSendError } from "./auth-otp";

describe("otpSendError", () => {
  it("rewrites rate-limit copy with a live countdown", () => {
    assert.deepEqual(
      otpSendError(
        "For security purposes, you can only request this after 23 seconds.",
      ),
      {
        message: "Wait 23 seconds, then try again.",
        waitSeconds: 23,
      },
    );
  });

  it("defaults to 60 seconds when no number is present", () => {
    assert.deepEqual(otpSendError("Email rate limit exceeded"), {
      message: "Wait 60 seconds, then try again.",
      waitSeconds: 60,
    });
  });

  it("treats wait a minute as 60 seconds", () => {
    assert.deepEqual(
      otpSendError("Please wait a minute and then request a new code"),
      {
        message: "Wait 60 seconds, then try again.",
        waitSeconds: 60,
      },
    );
  });

  it("passes other errors through", () => {
    assert.deepEqual(otpSendError("Invalid email"), {
      message: "Invalid email",
      waitSeconds: null,
    });
  });
});
