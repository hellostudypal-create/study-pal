import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitledBankIds } from "@/lib/authz";
import { buildWhatsAppLink } from "@/lib/config";

export default async function StoreBankPage({
  params,
}: {
  params: Promise<{ bankId: string }>;
}) {
  const { bankId } = await params;
  const bank = await db.bank.findUnique({
    where: { id: bankId },
    include: { _count: { select: { examQuestions: true, vocabWords: true } } },
  });

  if (!bank || bank.isPersonal || !bank.isPublished) {
    notFound();
  }

  const session = await auth();
  const owned = session?.user
    ? (await getEntitledBankIds(session.user.id)).includes(bank.id)
    : false;

  const itemCount = bank.kind === "exam" ? bank._count.examQuestions : bank._count.vocabWords;
  const subtitle = bank.kind === "exam" ? bank.examCategory : bank.theme;

  const sampleQuestions =
    bank.kind === "exam"
      ? await db.examQuestion.findMany({
          where: { bankId: bank.id },
          select: { id: true, questionText: true },
          orderBy: { createdAt: "asc" },
          take: 2,
        })
      : [];
  const sampleWords =
    bank.kind === "vocab"
      ? await db.vocabWord.findMany({
          where: { bankId: bank.id },
          select: { id: true, term: true, definition: true },
          orderBy: { createdAt: "asc" },
          take: 3,
        })
      : [];

  return (
    <div className="space-y-6">
      <Link href="/store" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
        ← Back to all banks
      </Link>

      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary">
              {bank.kind === "exam" ? "Exam" : "Vocabulary"}
            </span>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{bank.title}</h1>
            {subtitle && <p className="mt-0.5 text-muted-foreground">{subtitle}</p>}
          </div>
          {bank.price != null && (
            <span className="shrink-0 text-2xl font-extrabold text-primary">
              Rs. {Number(bank.price).toLocaleString()}
            </span>
          )}
        </div>

        {bank.description && <p className="mt-4 text-sm text-muted-foreground">{bank.description}</p>}

        <p className="mt-4 text-sm font-medium">
          {itemCount} {bank.kind === "exam" ? "questions" : "words"}
        </p>

        <div className="mt-6">
          {owned ? (
            <Link
              href="/dashboard"
              className="inline-flex rounded-md bg-success px-5 py-2.5 text-sm font-semibold text-white hover:bg-success/90"
            >
              You already have this — go to your dashboard
            </Link>
          ) : (
            <a
              href={buildWhatsAppLink(bank.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Interested? Message us on WhatsApp
            </a>
          )}
        </div>
      </div>

      {(sampleQuestions.length > 0 || sampleWords.length > 0) && (
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-bold text-muted-foreground">Sample of what's inside</h2>
          <div className="mt-3 space-y-3">
            {sampleQuestions.map((q) => (
              <p key={q.id} className="rounded-sm bg-muted p-3 text-sm">
                {q.questionText}
              </p>
            ))}
            {sampleWords.map((w) => (
              <div key={w.id} className="rounded-sm bg-muted p-3">
                <p className="text-sm font-semibold">{w.term}</p>
                {w.definition && <p className="text-sm text-muted-foreground">{w.definition}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
