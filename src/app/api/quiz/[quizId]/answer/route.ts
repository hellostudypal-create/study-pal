import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { applyAnswer } from "@/lib/srs";

const bodySchema = z.discriminatedUnion("kind", [
  z.object({
    quizItemId: z.string().uuid(),
    kind: z.literal("verified_choice"),
    selectedAnswer: z.string(),
  }),
  z.object({
    quizItemId: z.string().uuid(),
    kind: z.literal("self_assessed"),
    wasCorrect: z.boolean(),
  }),
]);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ quizId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { quizId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const quiz = await db.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const quizItem = await db.quizItem.findUnique({ where: { id: parsed.data.quizItemId } });
  if (!quizItem || quizItem.quizId !== quizId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (quizItem.answeredAt) {
    return NextResponse.json({ error: "Already answered" }, { status: 409 });
  }

  // The kind of answer must match what the quiz actually served, so a client
  // can't relabel a self-graded answer as a verified one (or vice versa).
  const expectsVerifiedChoice = quiz.mode === "multiple_choice";
  if (expectsVerifiedChoice !== (parsed.data.kind === "verified_choice")) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  let wasCorrect: boolean;
  if (parsed.data.kind === "verified_choice") {
    const vocabWord = quizItem.vocabWordId
      ? await db.vocabWord.findUnique({ where: { id: quizItem.vocabWordId } })
      : null;
    // Server computes correctness from the real definition — the client's
    // selection is just what they picked, not a claim of correctness.
    wasCorrect = vocabWord?.definition === parsed.data.selectedAnswer;
  } else {
    wasCorrect = parsed.data.wasCorrect;
  }

  const transition = applyAnswer(quizItem.boxLevelBefore, wasCorrect);

  await db.quizItem.update({
    where: { id: quizItem.id },
    data: {
      wasCorrect,
      boxLevelAfter: transition.boxLevelAfter,
      pointsAwarded: transition.pointsAwarded,
      answeredAt: new Date(),
    },
  });

  if (quizItem.vocabWordId) {
    await db.vocabWord.update({
      where: { id: quizItem.vocabWordId },
      data: {
        boxLevel: transition.boxLevelAfter,
        nextReviewAt: transition.nextReviewAt,
        timesSeen: { increment: 1 },
        timesCorrect: wasCorrect ? { increment: 1 } : undefined,
      },
    });
  } else if (quizItem.examQuestionId) {
    await db.examQuestion.update({
      where: { id: quizItem.examQuestionId },
      data: {
        boxLevel: transition.boxLevelAfter,
        nextReviewAt: transition.nextReviewAt,
        timesSeen: { increment: 1 },
        timesCorrect: wasCorrect ? { increment: 1 } : undefined,
      },
    });
  }

  return NextResponse.json({
    pointsAwarded: transition.pointsAwarded,
    boxLevelAfter: transition.boxLevelAfter,
  });
}
