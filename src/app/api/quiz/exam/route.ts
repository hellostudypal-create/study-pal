import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assembleExamQuiz } from "@/lib/quiz-assembly";

const bodySchema = z.object({
  count: z.number().int().min(1).max(50).default(10),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const count = parsed.success ? parsed.data.count : 10;

  const questions = await assembleExamQuiz(userId, count);
  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No questions yet — add some first." },
      { status: 400 }
    );
  }

  const quiz = await db.quiz.create({
    data: {
      userId,
      quizType: "exam",
      mode: "self_graded",
      totalQuestions: questions.length,
      items: {
        create: questions.map((q, order) => ({
          examQuestionId: q.id,
          order,
          boxLevelBefore: q.boxLevel,
        })),
      },
    },
    include: { items: true },
  });

  const images = await db.questionImage.findMany({
    where: { examQuestionId: { in: questions.map((q) => q.id) } },
    orderBy: { order: "asc" },
  });

  const responseItems = quiz.items.map((quizItem) => {
    const q = questions.find((q) => q.id === quizItem.examQuestionId)!;
    return {
      quizItemId: quizItem.id,
      examQuestionId: q.id,
      questionText: q.questionText,
      answerText: q.answerText,
      language: q.language,
      correctOptionLabel: q.correctOptionLabel,
      images: images
        .filter((img) => img.examQuestionId === q.id)
        .map((img) => ({ id: img.id, role: img.role, label: img.label, imagePath: img.imagePath })),
    };
  });

  return NextResponse.json({
    quiz: { id: quiz.id, mode: quiz.mode, totalQuestions: quiz.totalQuestions },
    items: responseItems,
  });
}
