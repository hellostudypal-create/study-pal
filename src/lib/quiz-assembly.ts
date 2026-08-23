import { db } from "@/lib/db";
import type { VocabWord, ExamQuestion } from "@prisma/client";
import { getEntitledBankIds } from "@/lib/authz";

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

async function resolveBankFilter(userId: string, kind: "exam" | "vocab", bankId?: string) {
  if (bankId) return { in: [bankId] };
  const bankIds = await getEntitledBankIds(userId, kind);
  return { in: bankIds };
}

export async function assembleVocabQuiz(userId: string, count: number, bankId?: string): Promise<VocabWord[]> {
  const now = new Date();
  const bankFilter = await resolveBankFilter(userId, "vocab", bankId);
  const due = await db.vocabWord.findMany({
    where: { bankId: bankFilter, nextReviewAt: { lte: now }, timesSeen: { gt: 0 } },
    orderBy: { nextReviewAt: "asc" },
    take: count,
  });
  const neverSeen = await db.vocabWord.findMany({
    where: { bankId: bankFilter, timesSeen: 0 },
    orderBy: { createdAt: "asc" },
    take: count,
  });
  const fallbackRandom = await db.vocabWord.findMany({
    where: { bankId: bankFilter },
    take: count * 2,
  });
  return assembleIds(due, neverSeen, fallbackRandom, count);
}

export async function assembleExamQuiz(userId: string, count: number, bankId?: string): Promise<ExamQuestion[]> {
  const now = new Date();
  const bankFilter = await resolveBankFilter(userId, "exam", bankId);
  const due = await db.examQuestion.findMany({
    where: { bankId: bankFilter, nextReviewAt: { lte: now }, timesSeen: { gt: 0 } },
    orderBy: { nextReviewAt: "asc" },
    take: count,
  });
  const neverSeen = await db.examQuestion.findMany({
    where: { bankId: bankFilter, timesSeen: 0 },
    orderBy: { createdAt: "asc" },
    take: count,
  });
  const fallbackRandom = await db.examQuestion.findMany({
    where: { bankId: bankFilter },
    take: count * 2,
  });
  return assembleIds(due, neverSeen, fallbackRandom, count);
}

// For vocab MCQ mode: pick up to 3 distractor definitions from the user's
// other words. Returns null if there aren't enough other words to draw from.
export async function pickDistractors(
  userId: string,
  excludeId: string,
  count = 3,
  bankId?: string
): Promise<string[] | null> {
  const bankFilter = await resolveBankFilter(userId, "vocab", bankId);
  const others = await db.vocabWord.findMany({
    where: { bankId: bankFilter, id: { not: excludeId }, definition: { not: null } },
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
