// Simplified Leitner-box spaced repetition. Levels 0-5; interval[level] = days
// until the item is due again after a correct answer at that level.
const INTERVAL_DAYS = [0, 1, 2, 4, 9, 21];
const MAX_BOX_LEVEL = INTERVAL_DAYS.length - 1;

export interface BoxTransition {
  boxLevelAfter: number;
  nextReviewAt: Date;
  pointsAwarded: number;
}

export function applyAnswer(boxLevelBefore: number, wasCorrect: boolean): BoxTransition {
  const now = new Date();

  if (!wasCorrect) {
    return {
      boxLevelAfter: 0,
      nextReviewAt: now,
      pointsAwarded: 0,
    };
  }

  const boxLevelAfter = Math.min(boxLevelBefore + 1, MAX_BOX_LEVEL);
  const intervalDays = INTERVAL_DAYS[boxLevelAfter];
  const nextReviewAt = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);
  const pointsAwarded = 10 + boxLevelBefore * 5;

  return { boxLevelAfter, nextReviewAt, pointsAwarded };
}
