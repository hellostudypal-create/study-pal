import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { ChapterForm } from "@/components/books/ChapterForm";
import { PhraseContentAccordion } from "@/components/books/PhraseContentAccordion";
import { PhraseBulkImportForm } from "@/components/books/PhraseBulkImportForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ bookId: string; chapterId: string }>;
}) {
  const { bookId, chapterId } = await params;
  const chapter = await db.bookChapter.findUnique({ where: { id: chapterId } });
  if (!chapter || chapter.bookId !== bookId) notFound();

  const phrases = await db.bookPhrase.findMany({
    where: { chapterId },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{chapter.title}</h1>
        <Link href={`/manage/books/${bookId}`} className={buttonVariants({ variant: "ghost" })}>
          ← Back to book
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chapter details</CardTitle>
        </CardHeader>
        <CardContent>
          <ChapterForm
            bookId={bookId}
            initial={{
              id: chapter.id,
              title: chapter.title,
              subtitle: chapter.subtitle ?? "",
              coverImageUrl: chapter.coverImageUrl ?? "",
              isFreePreview: chapter.isFreePreview,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phrases ({phrases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <PhraseContentAccordion
            bookId={bookId}
            chapterId={chapterId}
            items={phrases.map((p) => ({
              id: p.id,
              phrase: p.phrase,
              translationSi: p.translationSi,
              pronunciationSi: p.pronunciationSi,
              explanation: p.explanation,
              explanationSi: p.explanationSi,
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bulk import phrases</CardTitle>
          <CardDescription>
            Separate each phrase with a line containing just <code>---</code>. <code>TranslationSi:</code> is optional.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PhraseBulkImportForm bookId={bookId} chapterId={chapterId} />
        </CardContent>
      </Card>
    </div>
  );
}
