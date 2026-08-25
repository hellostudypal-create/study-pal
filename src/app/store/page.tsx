import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitledBankIds } from "@/lib/authz";

export default async function StorePage() {
  const session = await auth();
  const [banks, ownedBankIds] = await Promise.all([
    db.bank.findMany({
      where: { isPersonal: false, isPublished: true },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { examQuestions: true, vocabWords: true } } },
    }),
    session?.user ? getEntitledBankIds(session.user.id) : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Question &amp; vocabulary banks</h1>
        <p className="mt-2 text-muted-foreground">
          Practice sets for Grade 5 Scholarship, O/L, A/L, government exams, IQ tests, and themed vocabulary — pick a bank to see what's inside.
        </p>
      </div>

      {banks.length === 0 ? (
        <p className="text-muted-foreground">Nothing published yet — check back soon.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {banks.map((bank) => {
            const owned = ownedBankIds.includes(bank.id);
            const itemCount = bank.kind === "exam" ? bank._count.examQuestions : bank._count.vocabWords;
            const subtitle = bank.kind === "exam" ? bank.examCategory : bank.theme;
            return (
              <Link
                key={bank.id}
                href={`/store/${bank.id}`}
                className="flex flex-col rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary">
                    {bank.kind === "exam" ? "Exam" : "Vocabulary"}
                  </span>
                  {owned && (
                    <span className="rounded-full bg-success-tint px-2.5 py-1 text-[11px] font-bold text-success">
                      Owned
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-lg font-bold">{bank.title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                {bank.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{bank.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground">
                    {itemCount} {bank.kind === "exam" ? "questions" : "words"}
                  </span>
                  {bank.price != null && (
                    <span className="text-lg font-extrabold text-primary">Rs. {Number(bank.price).toLocaleString()}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
