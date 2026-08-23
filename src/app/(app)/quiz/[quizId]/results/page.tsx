import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function QuizResultsPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const userId = await getCurrentUserId();
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
      <h1 className="text-2xl font-bold tracking-tight">Quiz complete</h1>
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold">{quiz.pointsEarned}</p>
              <p className="text-xs text-muted-foreground">points</p>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {correctCount}/{quiz.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">correct</p>
            </div>
            <div>
              <p className="text-3xl font-bold">{accuracy}%</p>
              <p className="text-xs text-muted-foreground">accuracy</p>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Link
              href={quiz.quizType === "vocab" ? "/quiz/vocab" : "/quiz/exam"}
              className={buttonVariants({ className: "flex-1" })}
            >
              Quiz again
            </Link>
            <Link href="/progress" className={buttonVariants({ variant: "outline", className: "flex-1" })}>
              View progress
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
