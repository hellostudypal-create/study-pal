import Link from "next/link";
import { auth, getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth();
  const userId = await getCurrentUserId();
  const now = new Date();

  const [vocabCount, questionCount, vocabDue, examDue] = userId
    ? await Promise.all([
        db.vocabWord.count({ where: { userId } }),
        db.examQuestion.count({ where: { userId } }),
        db.vocabWord.count({ where: { userId, nextReviewAt: { lte: now } } }),
        db.examQuestion.count({ where: { userId, nextReviewAt: { lte: now } } }),
      ])
    : [0, 0, 0, 0];

  const dueTotal = vocabDue + examDue;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome, {session?.user?.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {dueTotal > 0
            ? `${dueTotal} item${dueTotal === 1 ? "" : "s"} due for review today.`
            : "Nothing due today — great time to add something new."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/quiz/vocab" className={buttonVariants({ size: "lg", className: "h-auto flex-col gap-1 py-4" })}>
          <span className="text-base font-semibold">Vocabulary Quiz</span>
          <span className="text-xs font-normal opacity-90">{vocabDue} due, {vocabCount} total</span>
        </Link>
        <Link href="/quiz/exam" className={buttonVariants({ size: "lg", variant: "secondary", className: "h-auto flex-col gap-1 py-4" })}>
          <span className="text-base font-semibold">Question Bank Quiz</span>
          <span className="text-xs font-normal opacity-90">{examDue} due, {questionCount} total</span>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/vocab">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-muted-foreground">Vocabulary</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{vocabCount}</p>
              <p className="text-sm text-muted-foreground">words banked</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/questions">
          <Card className="transition-colors hover:border-primary/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-muted-foreground">Question bank</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{questionCount}</p>
              <p className="text-sm text-muted-foreground">questions banked</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
