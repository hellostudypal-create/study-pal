import Link from "next/link";
import { BookOpen, HelpCircle } from "lucide-react";
import { auth, getCurrentUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitledBankIds } from "@/lib/authz";
import { getT } from "@/lib/i18n/translate";

export default async function DashboardPage() {
  const session = await auth();
  const userId = await getCurrentUserId();
  const t = await getT();
  const now = new Date();

  const [vocabCount, questionCount, vocabDue, examDue] = userId
    ? await (async () => {
        const [vocabBankIds, examBankIds] = await Promise.all([
          getEntitledBankIds(userId, "vocab"),
          getEntitledBankIds(userId, "exam"),
        ]);
        return Promise.all([
          db.vocabWord.count({ where: { bankId: { in: vocabBankIds } } }),
          db.examQuestion.count({ where: { bankId: { in: examBankIds } } }),
          db.vocabWord.count({ where: { bankId: { in: vocabBankIds }, nextReviewAt: { lte: now } } }),
          db.examQuestion.count({ where: { bankId: { in: examBankIds }, nextReviewAt: { lte: now } } }),
        ]);
      })()
    : [0, 0, 0, 0];

  const dueTotal = vocabDue + examDue;
  const firstName = session?.user?.name?.split(" ")[0] ?? session?.user?.name;

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-brand p-6 text-brand-foreground">
        <h1 className="text-2xl font-extrabold tracking-tight">{t("dashboard.greeting", { name: firstName ?? "" })}</h1>
        <p className="mt-1 text-sm opacity-90">
          {dueTotal > 0 ? t("dashboard.dueMessage") : t("dashboard.emptyMessage")}
        </p>
        {dueTotal > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            <span className="text-gold">✦</span> {t("dashboard.itemsDueToday", { count: dueTotal })}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/quiz/vocab" className="rounded-md bg-brand p-4 text-brand-foreground transition-opacity hover:opacity-90">
          <BookOpen className="h-5 w-5 text-gold" />
          <p className="mt-2 font-bold">{t("dashboard.vocabulary")}</p>
          <p className="text-xs opacity-90">{t("dashboard.dueOfTotal", { due: vocabDue, total: vocabCount })}</p>
        </Link>
        <Link href="/quiz/exam" className="rounded-md bg-brand-2 p-4 text-brand-foreground transition-opacity hover:opacity-90">
          <HelpCircle className="h-5 w-5 text-gold" />
          <p className="mt-2 font-bold">{t("dashboard.questionBank")}</p>
          <p className="text-xs opacity-90">{t("dashboard.dueOfTotal", { due: examDue, total: questionCount })}</p>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBox value={vocabCount} label={t("dashboard.statVocab")} />
        <StatBox value={questionCount} label={t("dashboard.statQuestions")} />
        <StatBox value={vocabDue} label={t("dashboard.statVocabDue")} />
        <StatBox value={examDue} label={t("dashboard.statExamDue")} />
      </div>
    </div>
  );
}

function StatBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-3 text-center">
      <p className="text-xl font-extrabold text-primary">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
