export interface RelevanceScoreInput {
  relevantVotes: number;
  lessRelevantVotes: number;
}

/**
 * Wilson lower bound score for binary votes.
 * This is more robust than raw vote balance for low-sample comments.
 */
export function calculateCommentRelevanceScore(input: RelevanceScoreInput): number {
  const relevantVotes = Math.max(0, input.relevantVotes);
  const lessRelevantVotes = Math.max(0, input.lessRelevantVotes);
  const total = relevantVotes + lessRelevantVotes;

  if (total === 0) {
    return 0;
  }

  const z = 1.96; // 95% confidence
  const z2 = z * z;
  const p = relevantVotes / total;

  const numerator =
    p + z2 / (2 * total) - z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  const denominator = 1 + z2 / total;

  return numerator / denominator;
}