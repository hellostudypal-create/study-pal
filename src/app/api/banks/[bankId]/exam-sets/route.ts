import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertEntitled } from "@/lib/authz";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bankId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bankId } = await params;
  const bank = await assertEntitled(userId, bankId);
  if (!bank || bank.kind !== "exam") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!bank.standardExamQuestionCount) {
    return NextResponse.json({ error: "Exam mode isn't configured for this bank" }, { status: 400 });
  }

  const setSize = bank.standardExamQuestionCount;
  const total = await db.examQuestion.count({ where: { bankId } });
  const setCount = Math.max(1, Math.ceil(total / setSize));

  const attempts = await db.quiz.findMany({
    where: { userId, bankId, sessionMode: "exam", completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    include: { items: { select: { wasCorrect: true } } },
  });
  const bestBySetIndex = new Map<number, (typeof attempts)[number]>();
  for (const attempt of attempts) {
    if (attempt.setIndex !== null && !bestBySetIndex.has(attempt.setIndex)) {
      bestBySetIndex.set(attempt.setIndex, attempt);
    }
  }

  const sets = Array.from({ length: setCount }, (_, i) => {
    const index = i + 1;
    const questionCount = Math.min(setSize, total - i * setSize);
    const timeLimitMinutes = bank.examTimeLimitMinutes
      ? Math.round((bank.examTimeLimitMinutes * questionCount) / setSize)
      : null;
    const lastAttempt = bestBySetIndex.get(index);

    return {
      index,
      questionCount,
      timeLimitMinutes,
      lastAttempt: lastAttempt
        ? {
            completedAt: lastAttempt.completedAt,
            correctCount: lastAttempt.items.filter((item) => item.wasCorrect === true).length,
            totalQuestions: lastAttempt.totalQuestions,
            pointsEarned: lastAttempt.pointsEarned,
          }
        : null,
    };
  });

  return NextResponse.json({ bankTitle: bank.title, setSize, timeLimitMinutes: bank.examTimeLimitMinutes, sets });
}
