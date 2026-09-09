import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assembleExamQuiz, assembleExamSet } from "@/lib/quiz-assembly";
import { assertEntitled } from "@/lib/authz";

const bodySchema = z.object({
  count: z.number().int().min(1).max(100).default(10),
  bankId: z.string().uuid().optional(),
  sessionMode: z.enum(["practice", "exam"]).default("practice"),
  setIndex: z.number().int().min(1).optional(),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const count = parsed.success ? parsed.data.count : 10;
  const bankId = parsed.success ? parsed.data.bankId : undefined;
  const sessionMode = parsed.success ? parsed.data.sessionMode : "practice";
  const setIndex = parsed.success ? parsed.data.setIndex : undefined;

  const bank = bankId ? await assertEntitled(userId, bankId) : null;
  if (bankId && !bank) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let questions;
  let timeLimitSeconds: number | null = null;

  if (sessionMode === "exam") {
    if (!bank || !bank.standardExamQuestionCount || !setIndex) {
      return NextResponse.json({ error: "Exam mode requires a bank with a standard exam size and a set." }, { status: 400 });
    }
    questions = await assembleExamSet(bank.id, setIndex, bank.standardExamQuestionCount);
    if (bank.examTimeLimitMinutes) {
      // Proportional to this set's actual size, so a short last set (e.g. a
      // 38-question remainder of a 50-question standard) isn't given the
      // same full hour as the other, full-sized sets.
      timeLimitSeconds = Math.round(
        (bank.examTimeLimitMinutes * 60 * questions.length) / bank.standardExamQuestionCount
      );
    }
  } else {
    questions = await assembleExamQuiz(userId, count, bankId);
  }

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
      bankId: bank?.id,
      quizType: "exam",
      mode: anyMcq ? "multiple_choice" : "self_graded",
      sessionMode,
      setIndex: sessionMode === "exam" ? setIndex : undefined,
      timeLimitSeconds,
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

  // Exam mode never sends the solution up front - it's revealed only after
  // /complete grades the attempt, on the results page. Practice mode keeps
  // sending it immediately for instant per-question feedback (scoring
  // authority is still the server-side check in /answer either way).
  const includeSolution = sessionMode !== "exam";

  const responseItems = quiz.items.map((quizItem) => {
    const q = questions.find((q) => q.id === quizItem.examQuestionId)!;
    return {
      quizItemId: quizItem.id,
      examQuestionId: q.id,
      questionText: q.questionText,
      answerText: includeSolution ? q.answerText : null,
      language: q.language,
      correctOptionLabel: includeSolution ? q.correctOptionLabel : null,
      explanationVideoUrl: includeSolution ? q.explanationVideoUrl : null,
      options: hasMcqOptions(q.id)
        ? optionsByQuestion.get(q.id)!.map((o) => ({ label: o.label, text: o.text }))
        : null,
      correctAnswer:
        includeSolution && hasMcqOptions(q.id)
          ? optionsByQuestion.get(q.id)!.find((o) => o.isCorrect)?.text ?? null
          : null,
      images: images
        .filter((img) => img.examQuestionId === q.id)
        .map((img) => ({ id: img.id, role: img.role, label: img.label, imagePath: img.imagePath })),
    };
  });

  return NextResponse.json({
    quiz: {
      id: quiz.id,
      mode: quiz.mode,
      sessionMode: quiz.sessionMode,
      setIndex: quiz.setIndex,
      timeLimitSeconds: quiz.timeLimitSeconds,
      startedAt: quiz.startedAt,
      totalQuestions: quiz.totalQuestions,
      bankTitle: bank?.title ?? null,
    },
    items: responseItems,
  });
}
