import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId } = await params;
  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { items: true },
  });
  if (!quiz || quiz.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const pointsEarned = quiz.items.reduce((sum, item) => sum + item.pointsAwarded, 0);
  const correctCount = quiz.items.filter((item) => item.wasCorrect === true).length;
  const answeredCount = quiz.items.filter((item) => item.answeredAt !== null).length;

  const updated = await db.quiz.update({
    where: { id: quizId },
    data: { completedAt: new Date(), pointsEarned },
  });

  return NextResponse.json({
    quiz: {
      id: updated.id,
      totalQuestions: updated.totalQuestions,
      answeredCount,
      correctCount,
      pointsEarned,
    },
  });
}
