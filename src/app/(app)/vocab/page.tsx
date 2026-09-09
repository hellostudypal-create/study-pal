import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getEntitledBankIds } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/translate";

const PAGE_SIZE = 20;

export default async function VocabListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; book?: string; page?: string }>;
}) {
  const params = await searchParams;
  const userId = await getCurrentUserId();
  const t = await getT();
  const q = params.q?.trim() ?? "";
  const book = params.book?.trim() || undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const bankIds = userId ? await getEntitledBankIds(userId, "vocab") : [];
  const where = {
    bankId: { in: bankIds },
    ...(book ? { bookId: book } : {}),
    ...(q
      ? {
          OR: [
            { term: { contains: q, mode: "insensitive" as const } },
            { definition: { contains: q, mode: "insensitive" as const } },
            { definitionSi: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [words, total, totalUnfiltered, books] = userId
    ? await Promise.all([
        db.vocabWord.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          include: { book: { select: { title: true } } },
        }),
        db.vocabWord.count({ where }),
        db.vocabWord.count({ where: { bankId: { in: bankIds } } }),
        db.sourceBook.findMany({
          where: { words: { some: { bankId: { in: bankIds } } } },
          orderBy: { title: "asc" },
          select: { id: true, title: true },
        }),
      ])
    : [[], 0, 0, []];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isFiltered = !!(q || book);

  function pageHref(targetPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (book) sp.set("book", book);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return qs ? `/vocab?${qs}` : "/vocab";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("vocab.title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("vocab.wordsBanked", {
              count: totalUnfiltered,
              noun: totalUnfiltered === 1 ? t("vocab.word") : t("vocab.words"),
            })}
            {isFiltered && t("vocab.matchingSearch", { count: total })}
          </p>
        </div>
        <Link href="/vocab/new" className={buttonVariants()}>
          {t("vocab.addWord")}
        </Link>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" action="/vocab">
        <Input name="q" defaultValue={q} placeholder={t("vocab.searchPlaceholder")} className="flex-1" />
        {books.length > 0 && (
          <Select name="book" defaultValue={book ?? ""} className="sm:w-56">
            <option value="">{t("vocab.anyBook")}</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </Select>
        )}
        <button type="submit" className={buttonVariants({ variant: "secondary" })}>
          {t("common.filter")}
        </button>
        {isFiltered && (
          <Link href="/vocab" className={buttonVariants({ variant: "ghost" })}>
            {t("common.clear")}
          </Link>
        )}
      </form>

      {words.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {isFiltered ? (
              <p>{t("vocab.noMatch")}</p>
            ) : (
              <>
                <p>{t("vocab.empty")}</p>
                <p className="mt-1 text-sm">{t("vocab.emptyHint")}</p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {words.map((word) => (
              <Link key={word.id} href={`/vocab/${word.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold">{word.term}</h3>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                          word.boxLevel === 0 && "bg-secondary text-muted-foreground",
                          word.boxLevel > 0 && word.boxLevel < 5 && "bg-primary-tint text-primary",
                          word.boxLevel === 5 && "bg-gold-tint text-gold-ink"
                        )}
                      >
                        {word.boxLevel === 0
                          ? t("vocab.new")
                          : word.boxLevel === 5
                            ? t("vocab.mastered")
                            : t("vocab.level", { level: word.boxLevel })}
                      </span>
                    </div>
                    {word.definition && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                        {word.definition}
                      </p>
                    )}
                    {word.definitionSi && (
                      <p className="mt-0.5 line-clamp-1 font-sinhala text-sm text-muted-foreground">
                        {word.definitionSi}
                      </p>
                    )}
                    {word.book && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {word.chapter
                          ? t("vocab.fromChapter", { book: word.book.title, chapter: word.chapter })
                          : t("vocab.from", { book: word.book.title })}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Link
                href={pageHref(page - 1)}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: page <= 1 ? "pointer-events-none opacity-40" : "",
                })}
              >
                {t("common.previous")}
              </Link>
              <span className="text-sm text-muted-foreground">
                {t("common.pageOf", { page, total: totalPages })}
              </span>
              <Link
                href={pageHref(page + 1)}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: page >= totalPages ? "pointer-events-none opacity-40" : "",
                })}
              >
                {t("common.next")}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
