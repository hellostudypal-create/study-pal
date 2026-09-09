import Link from "next/link";
import { BookOpen, HelpCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getEntitledBankIds } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { bankCardClassName, BankCardContent } from "@/components/quiz/BankCard";
import { getT } from "@/lib/i18n/translate";

const SETS_SHOWN = 4;

export default async function QuizHubPage() {
  const userId = await getCurrentUserId();
  const t = await getT();

  const [vocabBanks, examBanks] = userId
    ? await Promise.all([loadBanks(userId, "vocab"), loadBanks(userId, "exam")])
    : [[], []];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">{t("quiz.title")}</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/quiz/vocab" className="rounded-md bg-brand p-6 text-brand-foreground transition-opacity hover:opacity-90">
          <BookOpen className="h-6 w-6 text-gold" />
          <p className="mt-3 text-lg font-bold">{t("quiz.vocabQuiz")}</p>
          <p className="mt-1 text-sm opacity-90">{t("quiz.vocabQuizHint")}</p>
        </Link>
        <Link href="/quiz/exam" className="rounded-md bg-brand-2 p-6 text-brand-foreground transition-opacity hover:opacity-90">
          <HelpCircle className="h-6 w-6 text-gold" />
          <p className="mt-3 text-lg font-bold">{t("quiz.examQuiz")}</p>
          <p className="mt-1 text-sm opacity-90">{t("quiz.examQuizHint")}</p>
        </Link>
      </div>

      {vocabBanks.length > 0 && (
        <BankSection
          title={t("quiz.yourVocabSets")}
          browseAllLabel={t("quiz.browseAll")}
          browseHref="/quiz/vocab"
          banks={vocabBanks}
          quizHref={(bank) => `/quiz/vocab?bankId=${bank.id}&count=${Math.min(bank._count.vocabWords, 100)}`}
          icon={BookOpen}
          accentClassName="bg-brand"
          countLabel={t("quiz.wordsCount")}
        />
      )}

      {examBanks.length > 0 && (
        <BankSection
          title={t("quiz.yourQuestionBanks")}
          browseAllLabel={t("quiz.browseAll")}
          browseHref="/quiz/exam"
          banks={examBanks}
          quizHref={(bank) =>
            bank.standardExamQuestionCount
              ? `/quiz/exam?bankId=${bank.id}&mode=exam`
              : `/quiz/exam?bankId=${bank.id}&count=${Math.min(bank._count.examQuestions, 100)}`
          }
          icon={HelpCircle}
          accentClassName="bg-brand-2"
          countLabel={t("quiz.questionsCount")}
        />
      )}
    </div>
  );
}

async function loadBanks(userId: string, kind: "vocab" | "exam") {
  const bankIds = await getEntitledBankIds(userId, kind);
  return db.bank.findMany({
    where: { id: { in: bankIds } },
    orderBy: { title: "asc" },
    include: { _count: { select: { examQuestions: true, vocabWords: true } } },
  });
}

type BankWithCount = Awaited<ReturnType<typeof loadBanks>>[number];

function BankSection({
  title,
  browseAllLabel,
  browseHref,
  banks,
  quizHref,
  icon: Icon,
  accentClassName,
  countLabel,
}: {
  title: string;
  browseAllLabel: string;
  browseHref: string;
  banks: BankWithCount[];
  quizHref: (bank: BankWithCount) => string;
  icon: typeof BookOpen;
  accentClassName: string;
  countLabel: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <Link href={browseHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {browseAllLabel}
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {banks.slice(0, SETS_SHOWN).map((bank) => {
          const count = bank.kind === "exam" ? bank._count.examQuestions : bank._count.vocabWords;
          const subtitle = bank.kind === "exam" ? bank.examCategory : bank.theme;
          return (
            <Link key={bank.id} href={quizHref(bank)} className={bankCardClassName}>
              <BankCardContent
                bank={{ id: bank.id, title: bank.title, subtitle, count, countLabel, coverImageUrl: bank.coverImageUrl }}
                icon={Icon}
                accentClassName={accentClassName}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
