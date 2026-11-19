import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { settleLaunchRewards, runAccountBootstrap } from "./account-rewards";
import { inviteFriendsLine, pendingFriendsLine, waitlistJoinLine } from "./referral-copy";
import {
  REFERRAL_BONUS_DOTS_DEFAULT,
  REFERRAL_MAX_DEFAULT,
  WAITLIST_BONUS_DOTS_DEFAULT,
  referralBonusDots,
  referralMax,
  resetRewardConfigWarnings,
  waitlistBonusDots,
} from "./reward-config";

const KEYS = ["WAITLIST_BONUS_DOTS", "REFERRAL_BONUS_DOTS", "REFERRAL_MAX", "LAUNCH_OPEN"] as const;
const previous = new Map<string, string | undefined>();

function remember() {
  for (const key of KEYS) previous.set(key, process.env[key]);
}

function restore() {
  for (const key of KEYS) {
    const value = previous.get(key);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetRewardConfigWarnings();
}

describe("reward config", () => {
  afterEach(() => restore());

  it("uses the defaults when the env vars are unset", () => {
    remember();
    delete process.env.WAITLIST_BONUS_DOTS;
    delete process.env.REFERRAL_BONUS_DOTS;
    delete process.env.REFERRAL_MAX;
    assert.equal(waitlistBonusDots(), WAITLIST_BONUS_DOTS_DEFAULT);
    assert.equal(waitlistBonusDots(), 10);
    assert.equal(referralBonusDots(), REFERRAL_BONUS_DOTS_DEFAULT);
    assert.equal(referralMax(), REFERRAL_MAX_DEFAULT);
  });

  it("disables a grant when the env value is not a positive integer", () => {
    remember();
    const warnings: string[] = [];
    const original = console.warn;
    console.warn = (message?: unknown) => {
      warnings.push(String(message));
    };
    try {
      resetRewardConfigWarnings();
      process.env.WAITLIST_BONUS_DOTS = "10.5";
      assert.equal(waitlistBonusDots(), null);
      process.env.WAITLIST_BONUS_DOTS = "0";
      assert.equal(waitlistBonusDots(), null);
      process.env.WAITLIST_BONUS_DOTS = "-3";
      assert.equal(waitlistBonusDots(), null);
      process.env.REFERRAL_BONUS_DOTS = "two";
      assert.equal(referralBonusDots(), null);
      process.env.REFERRAL_MAX = "0";
      assert.equal(referralMax(), null);
      assert.ok(warnings.length >= 1);
    } finally {
      console.warn = original;
    }
  });

  it("renders the waitlist and invite lines from the parsed amounts", () => {
    assert.equal(
      waitlistJoinLine(WAITLIST_BONUS_DOTS_DEFAULT),
      `Join the waitlist, get ${WAITLIST_BONUS_DOTS_DEFAULT} Dots when we open.`,
    );
    assert.equal(
      inviteFriendsLine(REFERRAL_BONUS_DOTS_DEFAULT),
      `Invite friends, +${REFERRAL_BONUS_DOTS_DEFAULT} Dots each.`,
    );
    assert.equal(pendingFriendsLine(4), "4 friends joined, pending until launch");
  });

  it("does not grant before launch", async () => {
    remember();
    process.env.LAUNCH_OPEN = "false";
    const result = await settleLaunchRewards("00000000-0000-4000-8000-000000000001");
    assert.equal(result.skipped, "launch_closed");
    assert.equal(result.waitlist_granted, false);
    assert.equal(result.referral_paid, 0);
  });

  it("creates the profile before it tries to grant", async () => {
    const calls: string[] = [];
    await runAccountBootstrap(
      { id: "user", email: "a@b.co" },
      {
        ensureProfile: async () => {
          calls.push("ensure");
        },
        settle: async () => {
          calls.push("settle");
        },
        launchOpen: () => true,
      },
    );
    assert.deepEqual(calls, ["ensure", "settle"]);
  });

  it("skips the grant while launch is closed even if the profile is new", async () => {
    const calls: string[] = [];
    await runAccountBootstrap(
      { id: "user", email: "a@b.co" },
      {
        ensureProfile: async () => {
          calls.push("ensure");
        },
        settle: async () => {
          calls.push("settle");
        },
        launchOpen: () => false,
      },
    );
    assert.deepEqual(calls, ["ensure"]);
  });
});
