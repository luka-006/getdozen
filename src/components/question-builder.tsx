"use client";

import { useMemo, useState } from "react";
import { CreditIcon, PlusIcon, TrashIcon } from "@/components/icons";
import {
  CORE_QUESTIONS,
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  QUESTION_LIBRARY,
  creditCostForQuestionCount,
} from "@/lib/constants";
import { formatCredits } from "@/lib/utils";

type LibraryItem = { category: string; text: string };
type CustomQuestion = { text: string; suggestions: string[] };

const INITIAL_LIBRARY: LibraryItem[] = QUESTION_LIBRARY.flatMap((group) =>
  group.questions.map((text) => ({ category: group.category, text })),
);

type Props = {
  balance: number;
  /** Exact total questions required (core + custom + proof). */
  targetTotal?: number;
  /** Hide credit cost bar (combo packs set price separately). */
  showCost?: boolean;
};

function emptyCustom(count: number): CustomQuestion[] {
  return Array.from({ length: Math.max(1, count) }, () => ({
    text: "",
    suggestions: ["", ""],
  }));
}

export function QuestionBuilder({
  balance,
  targetTotal,
  showCost = true,
}: Props) {
  const customNeeded = targetTotal
    ? Math.max(1, targetTotal - CORE_QUESTIONS.length - 1)
    : 6;
  const [custom, setCustom] = useState<CustomQuestion[]>(() =>
    emptyCustom(customNeeded),
  );
  const [library, setLibrary] = useState<LibraryItem[]>(INITIAL_LIBRARY);
  const [proofQuestion, setProofQuestion] = useState("");
  const [proofAnswer, setProofAnswer] = useState("");
  const [popKey, setPopKey] = useState(0);

  const filledCustom = custom
    .map((q) => ({
      text: q.text.trim(),
      suggestions: q.suggestions.map((s) => s.trim()).filter(Boolean),
    }))
    .filter((q) => q.text.length > 0);

  const total =
    CORE_QUESTIONS.length + filledCustom.length + (proofQuestion.trim() ? 1 : 0);
  const cost = creditCostForQuestionCount(Math.max(total, MIN_QUESTIONS));
  const creditsToBuy = Math.max(1, Math.ceil(cost));
  const short = balance < cost;
  const payload = useMemo(() => JSON.stringify(filledCustom), [filledCustom]);
  const needExact = targetTotal ?? null;
  const exactOk = needExact == null || total === needExact;

  const libraryGroups = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const item of library) {
      const list = map.get(item.category) ?? [];
      list.push(item.text);
      map.set(item.category, list);
    }
    return [...map.entries()];
  }, [library]);

  function updateQuestion(index: number, value: string) {
    setCustom((prev) =>
      prev.map((q, i) => (i === index ? { ...q, text: value } : q)),
    );
  }

  function updateSuggestion(qIndex: number, sIndex: number, value: string) {
    setCustom((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const suggestions = [...q.suggestions];
        suggestions[sIndex] = value;
        return { ...q, suggestions };
      }),
    );
  }

  function addSuggestion(qIndex: number) {
    setCustom((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex || q.suggestions.length >= 6) return q;
        return { ...q, suggestions: [...q.suggestions, ""] };
      }),
    );
  }

  function removeQuestion(index: number) {
    setCustom((prev) => {
      if (prev.length <= 1) return [{ text: "", suggestions: ["", ""] }];
      return prev.filter((_, i) => i !== index);
    });
  }

  function addQuestion() {
    if (CORE_QUESTIONS.length + custom.length + 1 >= MAX_QUESTIONS) return;
    setCustom((prev) => [...prev, { text: "", suggestions: ["", ""] }]);
  }

  function addFromLibrary(text: string) {
    const alreadyUsed = custom.some((q) => q.text.trim() === text);
    if (alreadyUsed) return;

    const emptyIndex = custom.findIndex((q) => !q.text.trim());
    if (emptyIndex >= 0) {
      updateQuestion(emptyIndex, text);
    } else if (CORE_QUESTIONS.length + custom.length + 1 < MAX_QUESTIONS) {
      setCustom((prev) => [...prev, { text, suggestions: ["", ""] }]);
    } else {
      return;
    }

    setLibrary((prev) => prev.filter((item) => item.text !== text));
    setPopKey((k) => k + 1);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="font-display text-[22px] font-semibold">Core questions</h2>
        <ol className="mt-3 space-y-2">
          {CORE_QUESTIONS.map((q) => (
            <li key={q} className="well px-3 py-2.5 text-[15px]">
              {q}
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[22px] font-semibold">Your questions</h2>
            <p className="text-[13px] text-ink/60">
              {needExact
                ? `Need ${needExact} total (core + yours + proof).`
                : `${MIN_QUESTIONS}+ total · 1 credit each. Adding a question costs +1.`}
            </p>
          </div>
          <button type="button" className="btn btn-secondary" onClick={addQuestion}>
            <PlusIcon />
            Add
            {showCost ? (
              <span className="ml-1 text-[12px] font-normal text-ink/55">+1 credit</span>
            ) : null}
          </button>
        </div>

        <div className="space-y-4">
          {custom.map((item, index) => (
            <div
              className="surface space-y-3 p-3 motion-fade-in"
              key={`q-${index}-${popKey}`}
            >
              <div className="flex items-center justify-between gap-2">
                <label htmlFor={`custom-${index}`}>Question {index + 1}</label>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() => removeQuestion(index)}
                >
                  <TrashIcon />
                </button>
              </div>
              <input
                id={`custom-${index}`}
                className="input"
                value={item.text}
                onChange={(e) => updateQuestion(index, e.target.value)}
                minLength={item.text.trim() ? 8 : undefined}
                maxLength={300}
                placeholder="Ask one thing (8+ chars)"
              />
              <div className="space-y-2">
                <p className="text-[12px] text-ink/55">
                  Suggested answers · optional, no extra cost
                </p>
                {item.suggestions.map((s, sIndex) => (
                  <input
                    key={sIndex}
                    className="input"
                    value={s}
                    onChange={(e) =>
                      updateSuggestion(index, sIndex, e.target.value)
                    }
                    maxLength={200}
                    placeholder={`Option ${sIndex + 1}`}
                  />
                ))}
                {item.suggestions.length < 6 ? (
                  <button
                    type="button"
                    className="text-[13px] text-blue"
                    onClick={() => addSuggestion(index)}
                  >
                    + answer option
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <input type="hidden" name="custom_questions" value={payload} />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-[22px] font-semibold">Library</h2>
        {library.length === 0 ? (
          <p className="well px-3 py-3 text-[13px] text-ink/55">Empty.</p>
        ) : (
          <div className="space-y-4">
            {libraryGroups.map(([category, questions]) => (
              <div key={category}>
                <p className="mb-2 text-[12px] font-medium tracking-wide text-ink/50 uppercase">
                  {category}
                </p>
                <div className="flex flex-col gap-2">
                  {questions.map((q) => (
                    <button
                      key={q}
                      type="button"
                      className="library-chip group"
                      onClick={() => addFromLibrary(q)}
                    >
                      <span className="flex-1 text-left">{q}</span>
                      {showCost ? (
                        <span className="text-[11px] text-ink/45">+1 credit</span>
                      ) : null}
                      <span className="library-chip-add">
                        <PlusIcon className="h-3.5 w-3.5" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-[22px] font-semibold">Proof</h2>
        <p className="text-[12px] text-ink/55">Required · counts as +1 credit</p>
        <div className="field">
          <label htmlFor="proof_question">Question</label>
          <input
            id="proof_question"
            name="proof_question"
            className="input"
            required
            minLength={8}
            maxLength={300}
            value={proofQuestion}
            onChange={(e) => setProofQuestion(e.target.value)}
            placeholder="Button after signup?"
          />
          <p className="text-[12px] text-ink/55">At least 8 characters.</p>
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
            placeholder="Continue"
          />
        </div>
      </section>

      {showCost ? (
      <div className="cost-bar">
        <div className="flex flex-wrap items-center gap-2 text-[14px]">
          <CreditIcon className="h-5 w-5 text-ink" />
          <span>
            {total} questions ·{" "}
            <span className="inline-flex items-center gap-1 rounded-[6px] bg-credit px-1.5 py-0.5 font-mono text-ink">
              {formatCredits(cost)}
            </span>{" "}
            credits · 1 each
          </span>
          {needExact && !exactOk ? (
            <span className="text-[13px] text-flag">
              Need exactly {needExact}
            </span>
          ) : null}
          {!needExact && total < MIN_QUESTIONS ? (
            <span className="text-[13px] text-flag">
              Add {MIN_QUESTIONS - total} more
            </span>
          ) : null}
          {short ? (
            <span className="text-[13px] text-flag">
              You have {formatCredits(balance)}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            form="buy-credits-exact"
            name="credits"
            value={String(creditsToBuy)}
            className={short ? "btn btn-primary" : "btn btn-secondary"}
          >
            <CreditIcon className="h-4 w-4" />
            Buy {creditsToBuy} credit{creditsToBuy === 1 ? "" : "s"}
          </button>
        </div>
      </div>
      ) : (
        <p className="text-[13px] text-ink/60">
          {total} / {needExact ?? "—"} questions
          {needExact && !exactOk ? (
            <span className="text-flag"> · need exactly {needExact}</span>
          ) : null}
        </p>
      )}
    </div>
  );
}
