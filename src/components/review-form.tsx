"use client";

import { useMemo, useRef, useState } from "react";
import { submitReview } from "@/actions/reviews";
import { MIN_ANSWER_WORDS } from "@/lib/constants";
import { coreUiElementHint, proofOpenHint } from "@/lib/product-copy";
import { countWords } from "@/lib/utils";

type Question = {
  id: string;
  text: string;
  is_core: boolean;
  is_proof: boolean;
  position: number;
  suggested_answers?: string[] | null;
};

export function ReviewForm({
  requestId,
  questions,
  isDemo = false,
  proofHint = null,
  productType = "app",
}: {
  requestId: string;
  questions: Question[];
  isDemo?: boolean;
  proofHint?: string | null;
  productType?: string | null;
}) {
  const ordered = useMemo(
    () => [...questions].sort((a, b) => a.position - b.position),
    [questions],
  );
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<Record<string, string | null>>({});
  const [chipClicks, setChipClicks] = useState<Record<string, string[]>>({});
  const startedAt = useRef(Date.now());
  const timeInputRef = useRef<HTMLInputElement>(null);

  const current = ordered[index];
  const answer = answers[current?.id ?? ""] ?? "";
  const words = countWords(answer);
  const progress = ((index + 1) / ordered.length) * 100;
  const suggestions = (current?.suggested_answers ?? []).filter(Boolean);
  const canNext = current?.is_proof
    ? answer.trim().length > 0
    : words >= MIN_ANSWER_WORDS;

  function fillDemoAnswers() {
    const stamp = Date.now();
    const next: Record<string, string> = {};
    ordered.forEach((q, i) => {
      if (q.is_proof) {
        next[q.id] = proofHint ?? "test";
      } else {
        next[q.id] =
          `Demo answer ${i + 1} (${requestId.slice(0, 8)}): this product feels clear enough for a first pass. I would keep exploring the main flow and note a few rough edges around signup and pricing clarity.`;
      }
    });
    setAnswers(next);
    setPicked({});
    setChipClicks({});
    setIndex(0);
  }

  function chooseSuggestion(text: string) {
    if (!current) return;
    setPicked((prev) => ({ ...prev, [current.id]: text }));
    setChipClicks((prev) => ({
      ...prev,
      [current.id]: [...(prev[current.id] ?? []), text],
    }));
    setAnswers((prev) => {
      const existing = (prev[current.id] ?? "").trim();
      // Seed from chip; keep room for the reviewer to expand in writing.
      if (!existing || existing === picked[current.id]) {
        return { ...prev, [current.id]: `${text} — ` };
      }
      return { ...prev, [current.id]: `${existing} ${text}` };
    });
  }

  if (!current) return null;

  return (
    <form
      action={submitReview}
      className="space-y-6"
      onSubmit={() => {
        if (timeInputRef.current) {
          const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
          timeInputRef.current.value = String(
            isDemo ? Math.max(elapsed, 600) : elapsed,
          );
        }
      }}
    >
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="answers" value={JSON.stringify(answers)} />
      <input
        type="hidden"
        name="chip_clicks"
        value={JSON.stringify(chipClicks)}
      />
      <input
        ref={timeInputRef}
        type="hidden"
        name="time_spent_seconds"
        defaultValue="0"
      />

      {isDemo ? (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={fillDemoAnswers}
        >
          Fill dummy answers
        </button>
      ) : null}

      <div>
        <div className="mb-2 flex justify-between text-[13px] text-ink/65">
          <span>
            Question {index + 1} of {ordered.length}
          </span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-[6px] bg-mist">
          <div
            className="h-full bg-blue transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div key={current.id} className="space-y-2 motion-fade-in">
        {current.is_core ? (
          <p className="text-[13px] text-ink/55">
            Core question
            {index === 0
              ? ` — mention a concrete UI element (${coreUiElementHint(productType)})`
              : ""}
          </p>
        ) : null}
        {current.is_proof ? (
          <p className="text-[13px] text-ink/55">
            {proofOpenHint(productType)}
            {proofHint ? (
              <>
                {" "}
                · answer <span className="font-mono">{proofHint}</span>
              </>
            ) : null}
          </p>
        ) : null}
        <h2 className="font-display text-[24px] font-semibold">{current.text}</h2>
      </div>

      {!current.is_proof ? (
        <p className="text-[13px] leading-relaxed text-ink/60">
          This maker values direct, expanded answers in your own words. Chips
          are starters — write it out.
        </p>
      ) : null}

      {!current.is_proof && suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => {
            const active = picked[current.id] === s;
            return (
              <button
                key={s}
                type="button"
                className={`answer-chip ${active ? "answer-chip-active" : ""}`}
                onClick={() => chooseSuggestion(s)}
              >
                {s}
              </button>
            );
          })}
        </div>
      ) : null}

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
          placeholder={
            current.is_proof
              ? "Short proof answer"
              : "Write a direct, specific answer…"
          }
        />
        <p className="font-mono text-[12px] text-ink/55">
          {current.is_proof
            ? `${answer.trim().length} chars`
            : `${words} / ${MIN_ANSWER_WORDS} words`}
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
