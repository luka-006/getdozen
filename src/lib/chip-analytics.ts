export type ChipStat = {
  text: string;
  count: number;
  share: number;
};

export type QuestionChipInsights = {
  questionId: string;
  questionText: string;
  position: number;
  top: ChipStat[];
  reviewCount: number;
};

type QuestionRow = {
  id: string;
  text: string;
  position: number;
  is_proof?: boolean;
  suggested_answers?: string[] | null;
};

type ReviewRow = {
  answers?: Record<string, string> | null;
  chip_clicks?: Record<string, string[]> | null;
};

function clicksForQuestion(
  question: QuestionRow,
  review: ReviewRow,
): string[] {
  const tracked = review.chip_clicks?.[question.id];
  if (tracked?.length) return tracked;

  const suggestions = (question.suggested_answers ?? []).filter(Boolean);
  if (!suggestions.length) return [];

  const answer = review.answers?.[question.id] ?? "";
  if (!answer.trim()) return [];

  return suggestions.filter((chip) => answer.includes(chip));
}

export function aggregateQuestionChipInsights(
  questions: QuestionRow[],
  reviews: ReviewRow[],
): QuestionChipInsights[] {
  const ordered = [...questions]
    .filter((q) => !q.is_proof)
    .sort((a, b) => a.position - b.position);

  return ordered
    .map((question) => {
      const counts = new Map<string, number>();
      let reviewCount = 0;

      for (const review of reviews) {
        const clicks = clicksForQuestion(question, review);
        if (!clicks.length) continue;
        reviewCount += 1;
        for (const chip of clicks) {
          counts.set(chip, (counts.get(chip) ?? 0) + 1);
        }
      }

      const totalClicks = [...counts.values()].reduce((sum, n) => sum + n, 0);
      const top = [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([text, count]) => ({
          text,
          count,
          share: totalClicks > 0 ? Math.round((count / totalClicks) * 100) : 0,
        }));

      return {
        questionId: question.id,
        questionText: question.text,
        position: question.position,
        top,
        reviewCount,
      };
    })
    .filter((row) => row.top.length > 0);
}
