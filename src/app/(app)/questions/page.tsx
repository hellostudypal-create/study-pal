import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getEntitledBankIds } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ImageIcon } from "lucide-react";
import type { QuestionLanguage } from "@prisma/client";

const PAGE_SIZE = 20;

export default async function QuestionsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; language?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const userId = await getCurrentUserId();
  const q = params.q?.trim() ?? "";
  const language: QuestionLanguage | undefined =
    params.language === "en" || params.language === "si" ? params.language : undefined;
  const category = params.category?.trim() || undefined;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);

  const bankIds = userId ? await getEntitledBankIds(userId, "exam") : [];
  const where = {
    bankId: { in: bankIds },
    ...(language ? { language } : {}),
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { questionText: { contains: q, mode: "insensitive" as const } },
            { answerText: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [questions, total, categories, totalUnfiltered] = userId
    ? await Promise.all([
        db.examQuestion.findMany({
          where,
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { images: true } } },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
        }),
        db.examQuestion.count({ where }),
        db.examQuestion.findMany({
          where: { bankId: { in: bankIds }, category: { not: null } },
          select: { category: true },
          distinct: ["category"],
          orderBy: { category: "asc" },
        }),
        db.examQuestion.count({ where: { bankId: { in: bankIds } } }),
      ])
    : [[], 0, [], 0];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isFiltered = !!(q || language || category);

  function pageHref(targetPage: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (language) sp.set("language", language);
    if (category) sp.set("category", category);
    if (targetPage > 1) sp.set("page", String(targetPage));
    const qs = sp.toString();
    return qs ? `/questions?${qs}` : "/questions";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question bank</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalUnfiltered} {totalUnfiltered === 1 ? "question" : "questions"} banked
            {isFiltered && ` — ${total} matching filter`}
          </p>
        </div>
        <Link href="/questions/new" className={buttonVariants()}>
          + Add question
        </Link>
      </div>

      <form className="flex flex-col gap-2 sm:flex-row" action="/questions">
        <Input name="q" defaultValue={q} placeholder="Search questions or answers…" className="flex-1" />
        <Select name="language" defaultValue={language ?? ""} className="sm:w-40">
          <option value="">Any language</option>
          <option value="en">English</option>
          <option value="si">සිංහල</option>
        </Select>
        <Select name="category" defaultValue={category ?? ""} className="sm:w-56">
          <option value="">Any category</option>
          {categories.map((c) => (
            <option key={c.category} value={c.category!}>
              {c.category}
            </option>
          ))}
        </Select>
        <button type="submit" className={buttonVariants({ variant: "secondary" })}>
          Filter
        </button>
        {isFiltered && (
          <Link href="/questions" className={buttonVariants({ variant: "ghost" })}>
            Clear
          </Link>
        )}
      </form>

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            {isFiltered ? (
              <p>No questions match that search.</p>
            ) : (
              <>
                <p>No questions yet.</p>
                <p className="mt-1 text-sm">
                  Add a past exam or interview question — English or Sinhala, either works.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {questions.map((qItem) => (
              <Link key={qItem.id} href={`/questions/${qItem.id}`}>
                <Card className="h-full transition-colors hover:border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={cn(
                          "line-clamp-2 font-medium",
                          qItem.language === "si" && "font-sinhala"
                        )}
                      >
                        {qItem.questionText}
                      </p>
                      <Badge variant="outline">{qItem.language === "si" ? "සිංහල" : "EN"}</Badge>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {qItem.category && (
                        <p className="text-xs text-muted-foreground">{qItem.category}</p>
                      )}
                      {qItem._count.images > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                          <ImageIcon className="h-3 w-3" />
                          {qItem._count.images}
                        </span>
                      )}
                    </div>
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
