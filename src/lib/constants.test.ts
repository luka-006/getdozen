import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  MAX_CONCURRENT_COMMITMENTS,
  MAX_CONCURRENT_COMMITMENTS_PRO,
  MIN_QUESTIONS,
  MIN_TESTERS,
  TESTER_COST,
  creditCostForQuestionCount,
  reviewEarnForQuestionCount,
} from "./constants";

describe("creditCostForQuestionCount", () => {
  it("charges 1 credit per question", () => {
    assert.equal(creditCostForQuestionCount(12), 12);
    assert.equal(creditCostForQuestionCount(MIN_QUESTIONS), MIN_QUESTIONS);
    assert.equal(creditCostForQuestionCount(30), 30);
  });
});

describe("reviewEarnForQuestionCount", () => {
  it("keeps the old per-review earn bands", () => {
    assert.equal(reviewEarnForQuestionCount(12), 1);
    assert.equal(reviewEarnForQuestionCount(20), 1.5);
    assert.equal(reviewEarnForQuestionCount(30), 2);
  });
});

describe("tester and pro slots", () => {
  it("keeps testers at 2 credits with a floor of 12", () => {
    assert.equal(TESTER_COST, 2);
    assert.equal(MIN_TESTERS, 12);
  });

  it("lets Pro test 3 apps at once, free 1", () => {
    assert.equal(MAX_CONCURRENT_COMMITMENTS, 1);
    assert.equal(MAX_CONCURRENT_COMMITMENTS_PRO, 3);
  });
});
