import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assembleExamQuiz } from "@/lib/quiz-assembly";
import { assertEntitled } from "@/lib/authz";

const bodySchema = z.object({
  count: z.number().int().min(1).max(50).default(10),
  bankId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const count = parsed.success ? parsed.data.count : 10;
  const bankId = parsed.success ? parsed.data.bankId : undefined;

  if (bankId && !(await assertEntitled(userId, bankId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const questions = await assembleExamQuiz(userId, count, bankId);
  if (questions.length === 0) {
    return NextResponse.json(
      { error: "No questions yet — add some first." },
      { status: 400 }
    );
  }

  const options = await db.examQuestionOption.findMany({
    where: { examQuestionId: { in: questions.map((q) => q.id) } },
    orderBy: { order: "asc" },
  });
  const optionsByQuestion = new Map<string, typeof options>();
  for (const opt of options) {
    const list = optionsByQuestion.get(opt.examQuestionId) ?? [];
    list.push(opt);
    optionsByQuestion.set(opt.examQuestionId, list);
  }

  const hasMcqOptions = (questionId: string) => (optionsByQuestion.get(questionId)?.length ?? 0) === 4;
  const anyMcq = questions.some((q) => hasMcqOptions(q.id));

  const quiz = await db.quiz.create({
    data: {
      userId,
      quizType: "exam",
      mode: anyMcq ? "multiple_choice" : "self_graded",
      totalQuestions: questions.length,
      items: {
        create: questions.map((q, order) => ({
          examQuestionId: q.id,
          order,
          boxLevelBefore: q.boxLevel,
          answerKind: hasMcqOptions(q.id) ? "verified_choice" : "self_assessed",
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
      explanationVideoUrl: q.explanationVideoUrl,
      options: hasMcqOptions(q.id)
        ? optionsByQuestion.get(q.id)!.map((o) => ({ label: o.label, text: o.text }))
        : null,
      // Shown client-side for instant feedback, same as vocab's correctAnswer -
      // scoring authority is still the server-side check in /answer, which
      // never trusts what the client claims either way.
      correctAnswer: hasMcqOptions(q.id)
        ? optionsByQuestion.get(q.id)!.find((o) => o.isCorrect)?.text ?? null
        : null,
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
