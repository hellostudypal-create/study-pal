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

  // Same "don't keep resurfacing the same words" approach as
  // assembleExamQuiz: prefer words this user has never answered in any past
  // quiz, then fall back to their own least-recently-answered ones. QuizItem
  // has no direct relation to VocabWord (vocabWordId can also point at an
  // ExamQuestion depending on quiz type), so this is a two-step lookup.
  const seenIds = await db.quizItem.findMany({
    where: { quiz: { userId }, vocabWordId: { not: null } },
    select: { vocabWordId: true },
    distinct: ["vocabWordId"],
  });
  const seenIdSet = new Set(seenIds.map((s) => s.vocabWordId!));

  const due = await db.vocabWord.findMany({
    where: { bankId: bankFilter, nextReviewAt: { lte: now }, timesSeen: { gt: 0 } },
    orderBy: { nextReviewAt: "asc" },
    take: count,
  });
  const neverSeenByUser = await db.vocabWord.findMany({
    where: { bankId: bankFilter, id: { notIn: Array.from(seenIdSet) } },
    orderBy: { createdAt: "asc" },
    take: count * 2,
  });
  const leastRecentlySeenItems = await db.quizItem.findMany({
    where: { quiz: { userId }, vocabWordId: { in: Array.from(seenIdSet) } },
    orderBy: { answeredAt: "asc" },
    distinct: ["vocabWordId"],
    take: count * 2,
    select: { vocabWordId: true },
  });
  const leastRecentlySeenIds = leastRecentlySeenItems.map((i) => i.vocabWordId!);
  const leastRecentlySeenWords = await db.vocabWord.findMany({
    where: { id: { in: leastRecentlySeenIds }, bankId: bankFilter },
  });
  const byId = new Map(leastRecentlySeenWords.map((w) => [w.id, w]));
  const fallbackRandom = leastRecentlySeenIds
    .map((id) => byId.get(id))
    .filter((w): w is VocabWord => w !== undefined);

  return assembleIds(due, neverSeenByUser, fallbackRandom, count);
}

export async function assembleExamQuiz(userId: string, count: number, bankId?: string): Promise<ExamQuestion[]> {
  const now = new Date();
  const bankFilter = await resolveBankFilter(userId, "exam", bankId);

  // Questions this user has never answered in any past quiz - preferred over
  // ones they've already seen, so practice sessions don't keep resurfacing
  // the same handful of questions while others in the bank go untouched.
  const seenIds = await db.quizItem.findMany({
    where: { quiz: { userId }, examQuestionId: { not: null } },
    select: { examQuestionId: true },
    distinct: ["examQuestionId"],
  });
  const seenIdSet = new Set(seenIds.map((s) => s.examQuestionId!));

  const due = await db.examQuestion.findMany({
    where: { bankId: bankFilter, nextReviewAt: { lte: now }, timesSeen: { gt: 0 } },
    orderBy: { nextReviewAt: "asc" },
    take: count,
  });
  const neverSeenByUser = await db.examQuestion.findMany({
    where: { bankId: bankFilter, id: { notIn: Array.from(seenIdSet) } },
    orderBy: { createdAt: "asc" },
    take: count * 2,
  });
  // Fallback once the unseen pool is exhausted: this user's own
  // least-recently-answered questions, rather than an unordered draw that
  // could hand back something they only just finished. QuizItem has no
  // direct relation to ExamQuestion (examQuestionId can also point at a
  // VocabWord depending on quiz type), so this is a two-step lookup.
  const leastRecentlySeenItems = await db.quizItem.findMany({
    where: { quiz: { userId }, examQuestionId: { in: Array.from(seenIdSet) } },
    orderBy: { answeredAt: "asc" },
    distinct: ["examQuestionId"],
    take: count * 2,
    select: { examQuestionId: true },
  });
  const leastRecentlySeenIds = leastRecentlySeenItems.map((i) => i.examQuestionId!);
  const leastRecentlySeenQuestions = await db.examQuestion.findMany({
    where: { id: { in: leastRecentlySeenIds }, bankId: bankFilter },
  });
  const byId = new Map(leastRecentlySeenQuestions.map((q) => [q.id, q]));
  const fallbackRandom = leastRecentlySeenIds
    .map((id) => byId.get(id))
    .filter((q): q is ExamQuestion => q !== undefined);

  return assembleIds(due, neverSeenByUser, fallbackRandom, count);
}

// Deterministic, non-overlapping slice of a bank's questions for a standard
// exam set - e.g. an IQ bank with standardExamQuestionCount=50 splits into
// set 1 = rows [0,50), set 2 = [50,100), etc. Ordering must stay stable
// across requests (createdAt, tie-broken by id) so sets never shift or
// overlap as long as no questions are deleted from the middle of the bank.
export async function assembleExamSet(bankId: string, setIndex: number, size: number): Promise<ExamQuestion[]> {
  return db.examQuestion.findMany({
    where: { bankId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    skip: (setIndex - 1) * size,
    take: size,
  });
}

export interface DistractorOption {
  text: string;
  textSi: string | null;
}

// For vocab MCQ mode: pick up to `count` distractor definitions from the
// user's other words - fewer if the bank doesn't have that many, only null
// if there's nothing at all to draw from (falls back to typed self-grading).
// Carries each distractor's Sinhala definition alongside it (when that word
// has one) so the quiz UI can show it under the English option text.
export async function pickDistractors(
  userId: string,
  excludeId: string,
  count = 3,
  bankId?: string
): Promise<DistractorOption[] | null> {
  const bankFilter = await resolveBankFilter(userId, "vocab", bankId);
  const others = await db.vocabWord.findMany({
    where: { bankId: bankFilter, id: { not: excludeId }, definition: { not: null } },
    select: { definition: true, definitionSi: true },
  });
  const pool = others
    .filter((o) => o.definition)
    .map((o) => ({ text: o.definition!, textSi: o.definitionSi }));
  if (pool.length === 0) return null;

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
