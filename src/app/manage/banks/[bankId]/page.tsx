import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertCanEditBank } from "@/lib/authz";
import { BankForm } from "@/components/banks/BankForm";
import { EntitlementManager } from "@/components/banks/EntitlementManager";
import { VocabContentAccordion } from "@/components/banks/VocabContentAccordion";
import { QuestionContentAccordion } from "@/components/banks/QuestionContentAccordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const PAGE_SIZE = 20;

export default async function BankDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bankId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { bankId } = await params;
  const { page: pageParam } = await searchParams;
  const userId = await getCurrentUserId();
  const bank = userId ? await assertCanEditBank(userId, bankId) : null;
  if (!bank) notFound();

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [entitlements, contentTotal] = await Promise.all([
    db.entitlement.findMany({
      where: { bankId },
      include: { user: { select: { email: true, displayName: true } } },
      orderBy: { grantedAt: "desc" },
    }),
    bank.kind === "exam"
      ? db.examQuestion.count({ where: { bankId } })
      : db.vocabWord.count({ where: { bankId } }),
  ]);

  const contentTotalPages = Math.max(1, Math.ceil(contentTotal / PAGE_SIZE));
  const addHref =
    bank.kind === "exam" ? `/questions/new?bankId=${bankId}` : `/vocab/new?bankId=${bankId}`;

  // Full records for the current page only (capped at PAGE_SIZE), so the
  // inline accordion editor below can edit every field - including MCQ
  // options and images for questions, or book/chapter for words - without
  // a per-row fetch when a row is expanded.
  let questionAccordionItems: React.ComponentProps<typeof QuestionContentAccordion>["items"] = [];
  let vocabAccordionItems: React.ComponentProps<typeof VocabContentAccordion>["items"] = [];
  let books: React.ComponentProps<typeof VocabContentAccordion>["books"] = [];

  if (bank.kind === "exam") {
    const questions = await db.examQuestion.findMany({
      where: { bankId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });
    const questionIds = questions.map((q) => q.id);
    const [options, images] = await Promise.all([
      db.examQuestionOption.findMany({ where: { examQuestionId: { in: questionIds } }, orderBy: { order: "asc" } }),
      db.questionImage.findMany({ where: { examQuestionId: { in: questionIds } }, orderBy: { order: "asc" } }),
    ]);
    questionAccordionItems = questions.map((q) => ({
      id: q.id,
      questionText: q.questionText,
      answerText: q.answerText,
      language: q.language,
      category: q.category,
      correctOptionLabel: q.correctOptionLabel,
      explanationVideoUrl: q.explanationVideoUrl,
      options: options
        .filter((o) => o.examQuestionId === q.id)
        .map((o) => ({ label: o.label, text: o.text, isCorrect: o.isCorrect })),
      images: images
        .filter((img) => img.examQuestionId === q.id)
        .map((img) => ({ id: img.id, role: img.role, label: img.label, imagePath: img.imagePath })),
    }));
  } else {
    const [words, allBooks] = await Promise.all([
      db.vocabWord.findMany({
        where: { bankId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { book: { select: { title: true } } },
      }),
      db.sourceBook.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    ]);
    books = allBooks;
    vocabAccordionItems = words.map((w) => ({
      id: w.id,
      term: w.term,
      definition: w.definition,
      definitionSi: w.definitionSi,
      exampleSentence: w.exampleSentence,
      bookId: w.bookId,
      bookTitle: w.book?.title ?? null,
      chapter: w.chapter,
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{bank.title}</h1>
        <Link
          href={`/manage/banks/${bankId}/import`}
          className={buttonVariants({ variant: "secondary" })}
        >
          Import content
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BankForm
            initial={{
              id: bank.id,
              kind: bank.kind,
              title: bank.title,
              description: bank.description ?? "",
              coverImageUrl: bank.coverImageUrl ?? "",
              examCategory: bank.examCategory ?? "IQ",
              standardExamQuestionCount: bank.standardExamQuestionCount?.toString() ?? "",
              examTimeLimitMinutes: bank.examTimeLimitMinutes?.toString() ?? "",
              theme: bank.theme ?? "",
              price: bank.price?.toString() ?? "",
              isPublished: bank.isPublished,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Content ({contentTotal})</CardTitle>
          <Link href={addHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            + Add {bank.kind === "exam" ? "question" : "word"}
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {bank.kind === "exam" ? (
            <QuestionContentAccordion items={questionAccordionItems} />
          ) : (
            <VocabContentAccordion items={vocabAccordionItems} books={books} />
          )}
          {contentTotalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Link
                href={`/manage/banks/${bankId}?page=${page - 1}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: page <= 1 ? "pointer-events-none opacity-40" : "",
                })}
              >
                Previous
              </Link>
              <span className="text-sm text-muted-foreground">
                Page {page} of {contentTotalPages}
              </span>
              <Link
                href={`/manage/banks/${bankId}?page=${page + 1}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: page >= contentTotalPages ? "pointer-events-none opacity-40" : "",
                })}
              >
                Next
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Who has access</CardTitle>
        </CardHeader>
        <CardContent>
          <EntitlementManager
            bankId={bankId}
            initialEntitlements={entitlements.map((e) => ({
              id: e.id,
              source: e.source,
              grantedAt: e.grantedAt.toISOString(),
              user: e.user,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
