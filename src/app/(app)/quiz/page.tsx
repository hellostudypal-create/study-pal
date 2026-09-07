import Link from "next/link";
import { BookOpen, HelpCircle } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getEntitledBankIds } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { bankCardClassName, BankCardContent } from "@/components/quiz/BankCard";

const SETS_SHOWN = 4;

export default async function QuizHubPage() {
  const userId = await getCurrentUserId();

  const [vocabBanks, examBanks] = userId
    ? await Promise.all([loadBanks(userId, "vocab"), loadBanks(userId, "exam")])
    : [[], []];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Quiz</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/quiz/vocab"
          className="rounded-md bg-gradient-to-br from-primary-2 to-primary p-6 text-white transition-transform hover:scale-[1.02]"
        >
          <BookOpen className="h-6 w-6" />
          <p className="mt-3 text-lg font-bold">Vocabulary Quiz</p>
          <p className="mt-1 text-sm opacity-90">Words you got wrong before come back first.</p>
        </Link>
        <Link
          href="/quiz/exam"
          className="rounded-md bg-gradient-to-br from-gold-surface to-gold-surface-2 p-6 text-white transition-transform hover:scale-[1.02]"
        >
          <HelpCircle className="h-6 w-6" />
          <p className="mt-3 text-lg font-bold">Question Bank Quiz</p>
          <p className="mt-1 text-sm opacity-90">Reveal the answer, then mark yourself right or wrong.</p>
        </Link>
      </div>

      {vocabBanks.length > 0 && (
        <BankSection
          title="Your vocabulary sets"
          browseHref="/quiz/vocab"
          banks={vocabBanks}
          quizHref={(id) => `/quiz/vocab?bankId=${id}`}
          icon={BookOpen}
          gradient="from-primary-2 to-primary"
          countLabel="words"
        />
      )}

      {examBanks.length > 0 && (
        <BankSection
          title="Your question banks"
          browseHref="/quiz/exam"
          banks={examBanks}
          quizHref={(id) => `/quiz/exam?bankId=${id}`}
          icon={HelpCircle}
          gradient="from-gold-surface to-gold-surface-2"
          countLabel="questions"
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
  browseHref,
  banks,
  quizHref,
  icon: Icon,
  gradient,
  countLabel,
}: {
  title: string;
  browseHref: string;
  banks: BankWithCount[];
  quizHref: (id: string) => string;
  icon: typeof BookOpen;
  gradient: string;
  countLabel: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <Link href={browseHref} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Browse all
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {banks.slice(0, SETS_SHOWN).map((bank) => {
          const count = bank.kind === "exam" ? bank._count.examQuestions : bank._count.vocabWords;
          const subtitle = bank.kind === "exam" ? bank.examCategory : bank.theme;
          return (
            <Link key={bank.id} href={quizHref(bank.id)} className={bankCardClassName}>
              <BankCardContent
                bank={{ id: bank.id, title: bank.title, subtitle, count, countLabel }}
                icon={Icon}
                gradient={gradient}
              />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
