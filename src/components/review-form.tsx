"use client";

import { useMemo, useRef, useState } from "react";
import { submitReview } from "@/actions/reviews";
import { MIN_ANSWER_CHARS } from "@/lib/constants";

type Question = {
  id: string;
  text: string;
  is_core: boolean;
  is_proof: boolean;
  position: number;
};

export function ReviewForm({
  requestId,
  questions,
}: {
  requestId: string;
  questions: Question[];
}) {
  const ordered = useMemo(
    () => [...questions].sort((a, b) => a.position - b.position),
    [questions],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const startedAt = useRef(Date.now());
  const timeInputRef = useRef<HTMLInputElement>(null);

  const current = ordered[index];
  const answer = answers[current?.id ?? ""] ?? "";
  const progress = ((index + 1) / ordered.length) * 100;
  const canNext = answer.trim().length >= MIN_ANSWER_CHARS;

  if (!current) return null;

  return (
    <form
      action={submitReview}
      className="space-y-6"
      onSubmit={() => {
        if (timeInputRef.current) {
          timeInputRef.current.value = String(
            Math.floor((Date.now() - startedAt.current) / 1000),
          );
        }
      }}
    >
      <input type="hidden" name="request_id" value={requestId} />
      <input
        type="hidden"
        name="answers"
        value={JSON.stringify(answers)}
      />
      <input
        ref={timeInputRef}
        type="hidden"
        name="time_spent_seconds"
        defaultValue="0"
      />

      <div>
        <div className="mb-2 flex justify-between text-[13px] text-ink/65">
          <span>
            Question {index + 1} of {ordered.length}
          </span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-[6px] bg-mist">
          <div className="h-full bg-blue" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="space-y-2">
        {current.is_core ? (
          <p className="text-[13px] text-ink/55">Core question</p>
        ) : null}
        {current.is_proof ? (
          <p className="text-[13px] text-ink/55">
            Proof question — answer only if you opened the app
          </p>
        ) : null}
        <h2 className="font-display text-[24px] font-semibold">{current.text}</h2>
      </div>

      <div className="field">
        <label htmlFor="answer">Your answer</label>
        <textarea
          id="answer"
          className="textarea min-h-40"
          value={answer}
          onChange={(e) =>
            setAnswers((prev) => ({ ...prev, [current.id]: e.target.value }))
          }
          required
        />
        <p className="font-mono text-[12px] text-ink/55">
          {answer.trim().length} / {MIN_ANSWER_CHARS} min
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={index === 0}
          onClick={() => setIndex((v) => Math.max(0, v - 1))}
        >
          Back
        </button>
        {index < ordered.length - 1 ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={!canNext}
            onClick={() => setIndex((v) => Math.min(ordered.length - 1, v + 1))}
          >
            Next
          </button>
        ) : (
          <button type="submit" className="btn btn-primary" disabled={!canNext}>
            Submit review
          </button>
        )}
      </div>
    </form>
  );
}
