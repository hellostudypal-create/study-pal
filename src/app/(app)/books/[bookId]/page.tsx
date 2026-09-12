import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertBookEntitled } from "@/lib/authz";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { PhraseCard } from "@/components/books/PhraseCard";
import { getT } from "@/lib/i18n/translate";

const PHRASES_PER_PAGE = 8;

export default async function BookReaderPage({
  params,
  searchParams,
}: {
  params: Promise<{ bookId: string }>;
  searchParams: Promise<{ chapter?: string; page?: string }>;
}) {
  const { bookId } = await params;
  const { chapter: chapterParam, page: pageParam } = await searchParams;
  const userId = await getCurrentUserId();
  const t = await getT();

  const book = userId ? await assertBookEntitled(userId, bookId) : null;
  if (!book) notFound();

  const chapters = await db.bookChapter.findMany({
    where: { bookId },
    orderBy: { order: "asc" },
  });
  if (chapters.length === 0) notFound();

  const activeChapterIndex = chapters.findIndex((c) => c.id === chapterParam);
  const activeChapter = activeChapterIndex >= 0 ? chapters[activeChapterIndex] : chapters[0];
  const chapterNumber = (activeChapterIndex >= 0 ? activeChapterIndex : 0) + 1;

  const totalPhrases = await db.bookPhrase.count({ where: { chapterId: activeChapter.id, isReviewed: true } });
  const totalPages = Math.max(1, Math.ceil(totalPhrases / PHRASES_PER_PAGE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);

  const phrases = await db.bookPhrase.findMany({
    where: { chapterId: activeChapter.id, isReviewed: true },
    orderBy: { order: "asc" },
    skip: (page - 1) * PHRASES_PER_PAGE,
    take: PHRASES_PER_PAGE,
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
          {chapters.map((chapter, index) => {
            const active = chapter.id === activeChapter.id;
            return (
              <Link
                key={chapter.id}
                href={`/books/${bookId}?chapter=${chapter.id}`}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    active ? "bg-primary-foreground/20" : "bg-secondary"
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate">{chapter.title}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {activeChapter.coverImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={activeChapter.coverImageUrl}
                alt=""
                className="mx-auto h-32 w-32 shrink-0 rounded-lg object-cover shadow-sm sm:mx-0"
              />
            )}
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-primary">
                {t("books.chapterLabel", { number: chapterNumber })}
              </p>
              <h2 className="text-lg font-bold tracking-tight">{activeChapter.title}</h2>
              {activeChapter.subtitle && (
                <p className="mt-1 text-sm text-muted-foreground">{activeChapter.subtitle}</p>
              )}
            </div>
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
            <>
              <div className="space-y-3">
                {phrases.map((phrase, index) => (
                  <PhraseCard
                    key={phrase.id}
                    phrase={phrase}
                    number={(page - 1) * PHRASES_PER_PAGE + index + 1}
                    speechEnabled={book.speechEnabled}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  {page > 1 ? (
                    <Link
                      href={`/books/${bookId}?chapter=${activeChapter.id}&page=${page - 1}`}
                      className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1" })}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      {t("books.previous")}
                    </Link>
                  ) : (
                    <span className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1 opacity-40" })}>
                      <ChevronLeft className="h-4 w-4" />
                      {t("books.previous")}
                    </span>
                  )}

                  <p className="text-xs font-medium text-muted-foreground">
                    {t("books.pageOf", { page, total: totalPages })}
                  </p>

                  {page < totalPages ? (
                    <Link
                      href={`/books/${bookId}?chapter=${activeChapter.id}&page=${page + 1}`}
                      className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1" })}
                    >
                      {t("books.next")}
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  ) : (
                    <span className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1 opacity-40" })}>
                      {t("books.next")}
                      <ChevronRight className="h-4 w-4" />
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
