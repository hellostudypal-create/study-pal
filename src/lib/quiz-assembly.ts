import { db } from "@/lib/db";
import type { VocabWord, ExamQuestion } from "@prisma/client";

function assembleIds<T extends { id: string }>(
  due: T[],
  neverSeen: T[],
  fallbackRandom: T[],
  count: number
): T[] {
  const picked: T[] = [];
  const usedIds = new Set<string>();

  for (const item of due) {
    if (picked.length >= count) break;
    picked.push(item);
    usedIds.add(item.id);
  }
  for (const item of neverSeen) {
    if (picked.length >= count) break;
    if (usedIds.has(item.id)) continue;
    picked.push(item);
    usedIds.add(item.id);
  }
  for (const item of fallbackRandom) {
    if (picked.length >= count) break;
    if (usedIds.has(item.id)) continue;
    picked.push(item);
    usedIds.add(item.id);
  }

  // shuffle
  for (let i = picked.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [picked[i], picked[j]] = [picked[j], picked[i]];
  }
  return picked;
}

export async function assembleVocabQuiz(userId: string, count: number): Promise<VocabWord[]> {
  const now = new Date();
  const due = await db.vocabWord.findMany({
    where: { userId, nextReviewAt: { lte: now }, timesSeen: { gt: 0 } },
    orderBy: { nextReviewAt: "asc" },
    take: count,
  });
  const neverSeen = await db.vocabWord.findMany({
    where: { userId, timesSeen: 0 },
    orderBy: { createdAt: "asc" },
    take: count,
  });
  const fallbackRandom = await db.vocabWord.findMany({
    where: { userId },
    take: count * 2,
  });
  return assembleIds(due, neverSeen, fallbackRandom, count);
}

export async function assembleExamQuiz(userId: string, count: number): Promise<ExamQuestion[]> {
  const now = new Date();
  const due = await db.examQuestion.findMany({
    where: { userId, nextReviewAt: { lte: now }, timesSeen: { gt: 0 } },
    orderBy: { nextReviewAt: "asc" },
    take: count,
  });
  const neverSeen = await db.examQuestion.findMany({
    where: { userId, timesSeen: 0 },
    orderBy: { createdAt: "asc" },
    take: count,
  });
  const fallbackRandom = await db.examQuestion.findMany({
    where: { userId },
    take: count * 2,
  });
  return assembleIds(due, neverSeen, fallbackRandom, count);
}

// For vocab MCQ mode: pick up to 3 distractor definitions from the user's
// other words. Returns null if there aren't enough other words to draw from.
export async function pickDistractors(
  userId: string,
  excludeId: string,
  count = 3
): Promise<string[] | null> {
  const others = await db.vocabWord.findMany({
    where: { userId, id: { not: excludeId }, definition: { not: null } },
    select: { definition: true },
  });
  const pool = others.map((o) => o.definition!).filter(Boolean);
  if (pool.length < count) return null;

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
