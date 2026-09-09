import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { QuestionReviewRow, type ReviewItem } from "@/components/quiz/QuestionReviewRow";
import { getT } from "@/lib/i18n/translate";

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const userId = await getCurrentUserId();
  const t = await getT();
  const quiz = userId
    ? await db.quiz.findUnique({
        where: { id: quizId },
        include: { items: { orderBy: { order: "asc" } } },
      })
    : null;

  if (!quiz || quiz.userId !== userId) {
    notFound();
  }

  const correctCount = quiz.items.filter((i) => i.wasCorrect === true).length;
  const accuracy = quiz.totalQuestions > 0 ? Math.round((correctCount / quiz.totalQuestions) * 100) : 0;

  // Per-question review, exam quizzes only - QuizItem has no direct relation
  // to ExamQuestion (examQuestionId can also point at a VocabWord), so this
  // is a manual join, same pattern as /api/quiz/exam.
  let reviewItems: ReviewItem[] = [];
  if (quiz.quizType === "exam") {
    const examQuestionIds = quiz.items.map((i) => i.examQuestionId).filter((id): id is string => id !== null);
    const [questions, options, images] = await Promise.all([
      db.examQuestion.findMany({ where: { id: { in: examQuestionIds } } }),
      db.examQuestionOption.findMany({ where: { examQuestionId: { in: examQuestionIds } }, orderBy: { order: "asc" } }),
      db.questionImage.findMany({ where: { examQuestionId: { in: examQuestionIds } }, orderBy: { order: "asc" } }),
    ]);
    const questionById = new Map(questions.map((q) => [q.id, q]));

    reviewItems = quiz.items
      .filter((item) => item.examQuestionId !== null)
      .map((item) => {
        const q = questionById.get(item.examQuestionId!)!;
        const questionOptions = options.filter((o) => o.examQuestionId === q.id);
        const hasMcqOptions = questionOptions.length === 4;
        return {
          questionText: q.questionText,
          language: q.language,
          images: images
            .filter((img) => img.examQuestionId === q.id)
            .map((img) => ({ id: img.id, role: img.role, label: img.label, imagePath: img.imagePath })),
          options: hasMcqOptions ? questionOptions.map((o) => ({ label: o.label, text: o.text })) : null,
          selectedAnswer: item.selectedAnswer,
          correctAnswer: hasMcqOptions ? questionOptions.find((o) => o.isCorrect)?.text ?? null : null,
          correctOptionLabel: q.correctOptionLabel,
          answerText: q.answerText,
          explanationVideoUrl: q.explanationVideoUrl,
        };
      });
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("quiz.quizComplete")}</h1>
      <Card>
        <CardHeader>
          <CardTitle>{t("quiz.results")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{quiz.pointsEarned}</p>
              <p className="text-xs text-muted-foreground">{t("quiz.pointsWord")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {correctCount}/{quiz.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">{t("quiz.correctWord")}</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">{t("quiz.accuracyWord")}</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Link
              href={quiz.quizType === "vocab" ? "/quiz/vocab" : "/quiz/exam"}
              className={buttonVariants({ className: "flex-1" })}
            >
              {t("quiz.quizAgain")}
            </Link>
            <Link href="/progress" className={buttonVariants({ variant: "outline", className: "flex-1" })}>
              {t("quiz.viewProgress")}
            </Link>
          </div>
        </CardContent>
      </Card>

      {reviewItems.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">{t("quiz.reviewHeading")}</h2>
          {reviewItems.map((item, i) => (
            <QuestionReviewRow key={i} item={item} index={i} total={reviewItems.length} />
          ))}
        </div>
      )}
    </div>
  );
}
