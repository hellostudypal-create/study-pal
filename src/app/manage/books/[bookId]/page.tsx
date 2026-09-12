import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { BookForm } from "@/components/books/BookForm";
import { ChapterList } from "@/components/books/ChapterList";
import { BookEntitlementManager } from "@/components/books/BookEntitlementManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const [book, quizBanks, chapters, entitlements] = await Promise.all([
    db.book.findUnique({ where: { id: bookId } }),
    db.bank.findMany({ where: { kind: "exam" }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.bookChapter.findMany({
      where: { bookId },
      orderBy: { order: "asc" },
      include: { _count: { select: { phrases: true } } },
    }),
    db.bookEntitlement.findMany({
      where: { bookId },
      include: { user: { select: { email: true, displayName: true } } },
      orderBy: { grantedAt: "desc" },
    }),
  ]);

  if (!book) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BookForm
            quizBanks={quizBanks}
            initial={{
              id: book.id,
              title: book.title,
              author: book.author ?? "",
              description: book.description ?? "",
              coverImageUrl: book.coverImageUrl ?? "",
              price: book.price?.toString() ?? "",
              isPublished: book.isPublished,
              quizBankId: book.quizBankId ?? "",
              previewPhraseLimit: book.previewPhraseLimit.toString(),
              speechEnabled: book.speechEnabled,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chapters ({chapters.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ChapterList
            bookId={book.id}
            chapters={chapters.map((c) => ({
              id: c.id,
              title: c.title,
              order: c.order,
              isFreePreview: c.isFreePreview,
              phraseCount: c._count.phrases,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Who has access</CardTitle>
        </CardHeader>
        <CardContent>
          <BookEntitlementManager
            bookId={book.id}
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
