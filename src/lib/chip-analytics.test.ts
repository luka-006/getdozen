import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { aggregateQuestionChipInsights } from "./chip-analytics";

describe("aggregateQuestionChipInsights", () => {
  const questions = [
    {
      id: "q1",
      text: "What felt confusing?",
      position: 0,
      is_proof: false,
      suggested_answers: ["Signup", "Pricing", "Navigation"],
    },
    {
      id: "proof",
      text: "Proof",
      position: 99,
      is_proof: true,
      suggested_answers: [],
    },
  ];

  it("ranks top chip clicks per question", () => {
    const insights = aggregateQuestionChipInsights(questions, [
      {
        chip_clicks: { q1: ["Signup", "Pricing"] },
        answers: {},
      },
      {
        chip_clicks: { q1: ["Signup", "Signup"] },
        answers: {},
      },
    ]);

    assert.equal(insights.length, 1);
    assert.deepEqual(insights[0]?.top[0], {
      text: "Signup",
      count: 3,
      share: 75,
    });
    assert.deepEqual(insights[0]?.top[1], {
      text: "Pricing",
      count: 1,
      share: 25,
    });
  });

  it("infers clicks from answer text when chip_clicks missing", () => {
    const insights = aggregateQuestionChipInsights(questions, [
      {
        answers: { q1: "Pricing — the paywall copy was unclear." },
      },
    ]);

    assert.equal(insights[0]?.top[0]?.text, "Pricing");
    assert.equal(insights[0]?.top[0]?.count, 1);
  });
});
