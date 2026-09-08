import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getEntitledBankIds } from "@/lib/authz";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT, type TFunction } from "@/lib/i18n/translate";

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
  const t = await getT();

  const now = new Date();

  const [vocabBankIds, examBankIds] = await Promise.all([
    getEntitledBankIds(userId, "vocab"),
    getEntitledBankIds(userId, "exam"),
  ]);

  const [
    vocabByBox,
    examByBox,
    vocabDueCount,
    examDueCount,
    completedQuizzes,
    vocabAgg,
    examAgg,
  ] = await Promise.all([
    db.vocabWord.groupBy({ by: ["boxLevel"], where: { bankId: { in: vocabBankIds } }, _count: true }),
    db.examQuestion.groupBy({ by: ["boxLevel"], where: { bankId: { in: examBankIds } }, _count: true }),
    db.vocabWord.count({ where: { bankId: { in: vocabBankIds }, nextReviewAt: { lte: now } } }),
    db.examQuestion.count({ where: { bankId: { in: examBankIds }, nextReviewAt: { lte: now } } }),
    db.quiz.findMany({ where: { userId, completedAt: { not: null } }, select: { completedAt: true, pointsEarned: true } }),
    db.vocabWord.aggregate({ where: { bankId: { in: vocabBankIds } }, _sum: { timesSeen: true, timesCorrect: true } }),
    db.examQuestion.aggregate({ where: { bankId: { in: examBankIds } }, _sum: { timesSeen: true, timesCorrect: true } }),
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
      <h1 className="text-2xl font-bold tracking-tight">{t("progress.title")}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t("progress.dueToday")} value={vocabDueCount + examDueCount} />
        <StatCard label={t("progress.totalPoints")} value={totalPoints} />
        <StatCard label={t("progress.dayStreak")} value={streak} />
        <StatCard label={t("progress.accuracy")} value={accuracy !== null ? `${accuracy}%` : "—"} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("progress.vocabMastery")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MasteryBars counts={vocabBoxCounts} max={maxBoxCount} labels={masteryLabels(t)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("progress.questionMastery")}</CardTitle>
        </CardHeader>
        <CardContent>
          <MasteryBars counts={examBoxCounts} max={maxBoxCount} labels={masteryLabels(t)} />
        </CardContent>
      </Card>
    </div>
  );
}

function masteryLabels(t: TFunction) {
  return [
    t("progress.levelNew"),
    t("progress.level1"),
    t("progress.level2"),
    t("progress.level3"),
    t("progress.level4"),
    t("progress.mastered"),
  ];
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-sm border border-border bg-card p-3.5 text-center">
      <p className="text-2xl font-extrabold text-primary">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function MasteryBars({ counts, max, labels }: { counts: number[]; max: number; labels: string[] }) {
  return (
    <div className="space-y-2.5">
      {counts.map((count, level) => (
        <div key={level} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">{labels[level]}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-gold"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="w-6 shrink-0 text-right text-xs font-bold">{count}</span>
        </div>
      ))}
    </div>
  );
}
