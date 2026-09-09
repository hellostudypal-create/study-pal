import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertBookEntitled } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { PhraseCard } from "@/components/books/PhraseCard";
import { getT } from "@/lib/i18n/translate";

export default async function BookReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  const { bookId } = await params;
  const { chapter: chapterParam } = await searchParams;
  const userId = await getCurrentUserId();
  const t = await getT();

  const book = userId ? await assertBookEntitled(userId, bookId) : null;
  if (!book) notFound();

  const chapters = await db.bookChapter.findMany({
    where: { bookId },
    orderBy: { order: "asc" },
  });
  if (chapters.length === 0) notFound();

  const activeChapter = chapters.find((c) => c.id === chapterParam) ?? chapters[0];
  const phrases = await db.bookPhrase.findMany({
    where: { chapterId: activeChapter.id },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>
          {book.author && <p className="mt-0.5 text-sm text-muted-foreground">{book.author}</p>}
        </div>
        <a href={`/api/books/${bookId}/download`} className={buttonVariants({ variant: "outline", size: "sm" })}>
          {t("books.downloadPdf")}
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
          {chapters.map((chapter) => {
            const active = chapter.id === activeChapter.id;
            return (
              <Link
                key={chapter.id}
                href={`/books/${bookId}?chapter=${chapter.id}`}
                className={cn(
                  "shrink-0 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                {chapter.title}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">{activeChapter.title}</h2>
            {activeChapter.subtitle && <p className="mt-1 text-sm text-muted-foreground">{activeChapter.subtitle}</p>}
          </div>

          {book.quizBankId && (
            <Link
              href={`/quiz/exam?bankId=${book.quizBankId}`}
              className={buttonVariants({ variant: "secondary", className: "w-fit" })}
            >
              {t("books.takeTheQuiz")}
            </Link>
          )}

          {phrases.length === 0 ? (
            <p className="text-muted-foreground">{t("books.noPhrasesYet")}</p>
          ) : (
            <div className="space-y-3">
              {phrases.map((phrase) => (
                <PhraseCard key={phrase.id} phrase={phrase} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
