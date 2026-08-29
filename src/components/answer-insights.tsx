import type { QuestionChipInsights } from "@/lib/chip-analytics";

export function AnswerInsights({
  insights,
}: {
  insights: QuestionChipInsights[];
}) {
  if (!insights.length) return null;

  return (
    <section className="mt-10 space-y-5">
      <div>
        <p className="eyebrow">Feedback insights</p>
        <h2 className="mt-2 font-display text-[24px] font-semibold">
          Most picked answers
        </h2>
        <p className="mt-1 text-[13px] text-ink/60">
          Top chip picks from reviewers on your questions — updated as feedback
          comes in.
        </p>
      </div>

      <div className="grid gap-4">
        {insights.map((question) => (
          <article key={question.questionId} className="insight-card surface p-5">
            <p className="text-[12px] font-medium uppercase tracking-[0.08em] text-ink/45">
              Question {question.position + 1}
            </p>
            <h3 className="mt-1 font-display text-[18px] font-semibold leading-snug">
              {question.questionText}
            </h3>
            <p className="mt-1 text-[12px] text-ink/50">
              From {question.reviewCount}{" "}
              {question.reviewCount === 1 ? "review" : "reviews"}
            </p>

            <ol className="mt-4 space-y-2">
              {question.top.map((chip, index) => (
                <li key={chip.text} className="insight-row">
                  <span className="insight-rank font-mono text-[12px] text-ink/45">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 text-[14px] text-ink/85">
                    {chip.text}
                  </span>
                  <span className="insight-bar-wrap" aria-hidden>
                    <span
                      className="insight-bar"
                      style={{ width: `${Math.max(chip.share, 8)}%` }}
                    />
                  </span>
                  <span className="font-mono text-[12px] text-ink/55">
                    {chip.count} · {chip.share}%
                  </span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}
