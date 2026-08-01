"use client";

import { useState } from "react";
import { submitProfileReview } from "@/actions/profile-reviews";

export const PROFILE_REVIEW_PROMPTS = [
  "Gives shallow answers",
  "Thorough and specific",
  "Fast to confirm reviews",
  "Slow to respond",
  "Clear test instructions",
  "Reliable tester",
  "Would work with again",
] as const;

export function ProfileReviewForm({ toUserId }: { toUserId: string }) {
  const [body, setBody] = useState("");
  const [rating, setRating] = useState<number | "">("");

  return (
    <form action={submitProfileReview} className="surface space-y-4 p-4">
      <input type="hidden" name="to_user_id" value={toUserId} />
      <h3 className="font-display text-[18px] font-semibold">Leave a review</h3>
      <p className="text-[13px] text-ink/60">
        Based on feedback or testing you did together.
      </p>

      <div className="flex flex-wrap gap-2">
        {PROFILE_REVIEW_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="answer-chip"
            onClick={() =>
              setBody((prev) => (prev.trim() ? `${prev.trim()} ${prompt}` : prompt))
            }
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="field">
        <label htmlFor="profile_review_body">Review</label>
        <textarea
          id="profile_review_body"
          name="body"
          className="textarea min-h-24"
          required
          minLength={8}
          maxLength={280}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="e.g. Gives shallow answers"
        />
        <p className="font-mono text-[12px] text-ink/50">{body.length}/280</p>
      </div>

      <div className="field">
        <label htmlFor="profile_review_rating">Rating (optional)</label>
        <select
          id="profile_review_rating"
          name="rating"
          className="select"
          value={rating}
          onChange={(e) =>
            setRating(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">No rating</option>
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n}★
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-primary">
        Post review
      </button>
    </form>
  );
}
