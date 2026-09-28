"use client";

import { useState } from "react";
import { submitTestExperience } from "@/actions/testers";

const EXPERIENCE_LABELS: Record<number, string> = {
  5: "Great",
  4: "Good",
  3: "Okay",
  2: "Rough",
  1: "Poor",
};

export function TesterExperienceForm({
  commitmentId,
  initialRating,
}: {
  commitmentId: string;
  initialRating?: number | null;
}) {
  const [rating, setRating] = useState<number | "">(initialRating ?? "");

  if (initialRating) {
    return (
      <p className="text-[14px] text-ink/70">
        You rated this test{" "}
        <span className="font-mono">{initialRating}★</span>
        {EXPERIENCE_LABELS[initialRating]
          ? ` · ${EXPERIENCE_LABELS[initialRating]}`
          : null}
        .
      </p>
    );
  }

  return (
    <form action={submitTestExperience} className="surface space-y-4 p-4">
      <input type="hidden" name="commitment_id" value={commitmentId} />
      <div>
        <h3 className="font-display text-[18px] font-semibold">
          How was this test?
        </h3>
        <p className="mt-1 text-[13px] text-ink/60">
          Quick rating for your own record — optional.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[5, 4, 3, 2, 1].map((value) => (
          <label key={value} className="cursor-pointer">
            <input
              type="radio"
              name="experience_rating"
              value={value}
              className="peer sr-only"
              checked={rating === value}
              onChange={() => setRating(value)}
            />
            <span className="answer-chip peer-checked:border-blue peer-checked:bg-blue/10 peer-checked:text-blue">
              {value}★ · {EXPERIENCE_LABELS[value]}
            </span>
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="btn btn-secondary"
        disabled={rating === ""}
      >
        Save rating
      </button>
    </form>
  );
}
