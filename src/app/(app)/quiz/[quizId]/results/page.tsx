import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
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
    ? await db.quiz.findUnique({ where: { id: quizId }, include: { items: true } })
    : null;

  if (!quiz || quiz.userId !== userId) {
    notFound();
  }

  const correctCount = quiz.items.filter((i) => i.wasCorrect === true).length;
  const accuracy = quiz.totalQuestions > 0 ? Math.round((correctCount / quiz.totalQuestions) * 100) : 0;

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
    </div>
  );
}
