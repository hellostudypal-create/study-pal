import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function computeStreak(dates: Date[]): number {
  const dayStrings = new Set(
    dates.map((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString())
  );
  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  // if nothing completed today, streak can still count from yesterday backwards
  if (!dayStrings.has(cursor.toISOString())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dayStrings.has(cursor.toISOString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function ProgressPage() {
  const userId = await getCurrentUserId();
  if (!userId) return null;

  const now = new Date();

  const [
    vocabByBox,
    examByBox,
    vocabDueCount,
    examDueCount,
    completedQuizzes,
    vocabAgg,
    examAgg,
  ] = await Promise.all([
    db.vocabWord.groupBy({ by: ["boxLevel"], where: { userId }, _count: true }),
    db.examQuestion.groupBy({ by: ["boxLevel"], where: { userId }, _count: true }),
    db.vocabWord.count({ where: { userId, nextReviewAt: { lte: now } } }),
    db.examQuestion.count({ where: { userId, nextReviewAt: { lte: now } } }),
    db.quiz.findMany({ where: { userId, completedAt: { not: null } }, select: { completedAt: true, pointsEarned: true } }),
    db.vocabWord.aggregate({ where: { userId }, _sum: { timesSeen: true, timesCorrect: true } }),
    db.examQuestion.aggregate({ where: { userId }, _sum: { timesSeen: true, timesCorrect: true } }),
  ]);

  const totalPoints = completedQuizzes.reduce((sum, q) => sum + q.pointsEarned, 0);
  const streak = computeStreak(completedQuizzes.map((q) => q.completedAt!));

  const timesSeen = (vocabAgg._sum.timesSeen ?? 0) + (examAgg._sum.timesSeen ?? 0);
  const timesCorrect = (vocabAgg._sum.timesCorrect ?? 0) + (examAgg._sum.timesCorrect ?? 0);
  const accuracy = timesSeen > 0 ? Math.round((timesCorrect / timesSeen) * 100) : null;

  const boxCounts = (rows: { boxLevel: number; _count: number }[]) => {
    const counts = [0, 0, 0, 0, 0, 0];
    for (const r of rows) counts[r.boxLevel] = r._count;
    return counts;
  };
  const vocabBoxCounts = boxCounts(vocabByBox);
  const examBoxCounts = boxCounts(examByBox);
  const maxBoxCount = Math.max(1, ...vocabBoxCounts, ...examBoxCounts);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Progress</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Due today" value={vocabDueCount + examDueCount} />
        <StatCard label="Total points" value={totalPoints} />
        <StatCard label="Day streak" value={streak} />
        <StatCard label="Accuracy" value={accuracy !== null ? `${accuracy}%` : "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vocabulary mastery</CardTitle>
        </CardHeader>
        <CardContent>
          <MasteryBars counts={vocabBoxCounts} max={maxBoxCount} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question bank mastery</CardTitle>
        </CardHeader>
        <CardContent>
          <MasteryBars counts={examBoxCounts} max={maxBoxCount} />
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function MasteryBars({ counts, max }: { counts: number[]; max: number }) {
  const labels = ["New", "Lvl 1", "Lvl 2", "Lvl 3", "Lvl 4", "Mastered"];
  return (
    <div className="space-y-2">
      {counts.map((count, level) => (
        <div key={level} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-muted-foreground">{labels[level]}</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-medium">{count}</span>
        </div>
      ))}
    </div>
  );
}
