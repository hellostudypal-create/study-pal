import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { applyAnswer } from "@/lib/srs";

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
  if (quiz.completedAt) {
    return NextResponse.json({ error: "Quiz already completed" }, { status: 409 });
  }

  // Exam mode defers all grading to this single pass, so the learner could
  // freely revisit/change answers up to now without anything being locked
  // in or scored early.
  if (quiz.sessionMode === "exam") {
    for (const item of quiz.items) {
      if (!item.examQuestionId || item.selectedAnswer === null) continue;

      const correctOption = await db.examQuestionOption.findFirst({
        where: { examQuestionId: item.examQuestionId, isCorrect: true },
      });
      const wasCorrect = correctOption?.text === item.selectedAnswer;
      const transition = applyAnswer(item.boxLevelBefore, wasCorrect);

      await db.quizItem.update({
        where: { id: item.id },
        data: {
          wasCorrect,
          boxLevelAfter: transition.boxLevelAfter,
          pointsAwarded: transition.pointsAwarded,
          answeredAt: new Date(),
        },
      });
      await db.examQuestion.update({
        where: { id: item.examQuestionId },
        data: {
          boxLevel: transition.boxLevelAfter,
          nextReviewAt: transition.nextReviewAt,
          timesSeen: { increment: 1 },
          timesCorrect: wasCorrect ? { increment: 1 } : undefined,
        },
      });
    }
    // Re-fetch: the loop above just updated wasCorrect/pointsAwarded on items
    // that were still holding their pre-grading defaults in the object above.
    quiz.items = await db.quizItem.findMany({ where: { quizId } });
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
