import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getEntitledBankIds } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const PAGE_SIZE = 20;

export default async function VocabListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const userId = await getCurrentUserId();
  const q = params.q?.trim() ?? "";
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const bankIds = userId ? await getEntitledBankIds(userId, "vocab") : [];
  const where = {
    bankId: { in: bankIds },
    ...(q
      ? {
          OR: [
            { term: { contains: q, mode: "insensitive" as const } },
            { definition: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [words, total, totalUnfiltered] = userId
    ? await Promise.all([
        db.vocabWord.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        db.vocabWord.count({ where }),
        db.vocabWord.count({ where: { bankId: { in: bankIds } } }),
      ])
    : [[], 0, 0];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isFiltered = !!q;

  function pageHref(targetPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return qs ? `/vocab?${qs}` : "/vocab";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vocabulary</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalUnfiltered} {totalUnfiltered === 1 ? "word" : "words"} banked
            {isFiltered && ` — ${total} matching search`}
          </p>
        </div>
        <Link href="/vocab/new" className={buttonVariants()}>
          + Add word
        </Link>
      </div>

      <form className="flex gap-2" action="/vocab">
        <Input name="q" defaultValue={q} placeholder="Search words or definitions…" className="flex-1" />
        <button type="submit" className={buttonVariants({ variant: "secondary" })}>
          Search
        </button>
        {isFiltered && (
          <Link href="/vocab" className={buttonVariants({ variant: "ghost" })}>
            Clear
          </Link>
        )}
      </form>

      {words.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {isFiltered ? (
              <p>No words match that search.</p>
            ) : (
              <>
                <p>No words yet.</p>
                <p className="mt-1 text-sm">
                  Add the next word you look up while reading — that&apos;s all it takes to start.
                </p>
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
                      <Badge variant={word.boxLevel === 0 ? "outline" : "secondary"}>
                        {word.boxLevel === 0 ? "New" : `Level ${word.boxLevel}`}
                      </Badge>
                    </div>
                    {word.definition && (
                      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                        {word.definition}
                      </p>
                    )}
                    {word.sourceBook && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        From: {word.sourceBook}
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
                Previous
              </Link>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Link
                href={pageHref(page + 1)}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: page >= totalPages ? "pointer-events-none opacity-40" : "",
                })}
              >
                Next
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
