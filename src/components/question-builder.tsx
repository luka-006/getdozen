"use client";

import { useMemo, useState } from "react";
import {
  CORE_QUESTIONS,
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  QUESTION_LIBRARY,
  creditCostForQuestionCount,
} from "@/lib/constants";
import { formatCredits } from "@/lib/utils";

export function QuestionBuilder() {
  const [custom, setCustom] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [proofQuestion, setProofQuestion] = useState("");
  const [proofAnswer, setProofAnswer] = useState("");

  const filledCustom = custom.map((q) => q.trim()).filter(Boolean);
  const total = CORE_QUESTIONS.length + filledCustom.length + (proofQuestion.trim() ? 1 : 0);
  const cost = creditCostForQuestionCount(Math.max(total, MIN_QUESTIONS));

  const payload = useMemo(() => JSON.stringify(filledCustom), [filledCustom]);

  function updateQuestion(index: number, value: string) {
    setCustom((prev) => prev.map((q, i) => (i === index ? value : q)));
  }

  function addQuestion() {
    if (CORE_QUESTIONS.length + custom.length + 1 >= MAX_QUESTIONS) return;
    setCustom((prev) => [...prev, ""]);
  }

  function addFromLibrary(text: string) {
    const emptyIndex = custom.findIndex((q) => !q.trim());
    if (emptyIndex >= 0) {
      updateQuestion(emptyIndex, text);
      return;
    }
    if (CORE_QUESTIONS.length + custom.length + 1 < MAX_QUESTIONS) {
      setCustom((prev) => [...prev, text]);
    }
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-[24px] font-semibold">Core questions</h2>
        <p className="text-[13px] text-ink/65">
          Locked on every request. Cannot be edited or removed.
        </p>
        <ol className="space-y-2">
          {CORE_QUESTIONS.map((q) => (
            <li key={q} className="well px-3 py-2 text-[15px]">
              {q}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[24px] font-semibold">Your questions</h2>
            <p className="text-[13px] text-ink/65">
              {MIN_QUESTIONS}–{MAX_QUESTIONS} total including core and proof.
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={addQuestion}>
            Add question
          </button>
        </div>

        <div className="space-y-3">
          {custom.map((value, index) => (
            <div className="field" key={index}>
              <label htmlFor={`custom-${index}`}>Question {index + 1}</label>
              <input
                id={`custom-${index}`}
                className="input"
                value={value}
                onChange={(e) => updateQuestion(index, e.target.value)}
                maxLength={300}
              />
            </div>
          ))}
        </div>

        <input type="hidden" name="custom_questions" value={payload} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-[24px] font-semibold">Question library</h2>
        <div className="space-y-4">
          {QUESTION_LIBRARY.map((group) => (
            <div key={group.category}>
              <p className="mb-2 text-[13px] font-medium">{group.category}</p>
              <div className="flex flex-col gap-2">
                {group.questions.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="rounded-[6px] border border-border px-3 py-2 text-left text-[13px] hover:bg-mist"
                    onClick={() => addFromLibrary(q)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-[24px] font-semibold">Proof question</h2>
        <p className="text-[13px] text-ink/65">
          One question with a known correct answer. Checked automatically.
          Failed proofs never reach you.
        </p>
        <div className="field">
          <label htmlFor="proof_question">Question</label>
          <input
            id="proof_question"
            name="proof_question"
            className="input"
            required
            value={proofQuestion}
            onChange={(e) => setProofQuestion(e.target.value)}
            placeholder="What is the label on the main button after signup?"
          />
        </div>
        <div className="field">
          <label htmlFor="proof_answer">Expected answer</label>
          <input
            id="proof_answer"
            name="proof_answer"
            className="input"
            required
            value={proofAnswer}
            onChange={(e) => setProofAnswer(e.target.value)}
          />
        </div>
      </section>

      <div className="well flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <p className="text-[13px]">
          {total} questions · costs{" "}
          <span className="rounded-[6px] bg-credit px-1.5 py-0.5 font-mono text-ink">
            {formatCredits(cost)}
          </span>{" "}
          credits
        </p>
        {total < MIN_QUESTIONS ? (
          <p className="text-[13px] text-flag">
            Add {MIN_QUESTIONS - total} more to reach the minimum
          </p>
        ) : null}
      </div>
    </div>
  );
}
