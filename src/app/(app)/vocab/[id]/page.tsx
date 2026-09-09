import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { loadVocabWordForEdit, loadVocabWordForRead } from "@/lib/authz";
import { WordForm } from "@/components/vocab/WordForm";
import { WordDetail } from "@/components/vocab/WordDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n/translate";

export default async function WordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const t = await getT();

  // Check edit rights first: admins/owners/content editors can always
  // manage a bank's words even without a personal purchase entitlement
  // for it, so this must not fall through to the entitlement-gated
  // read path below.
  const editableWord = userId ? await loadVocabWordForEdit(userId, id) : null;
  const word = editableWord ?? (userId ? await loadVocabWordForRead(userId, id) : null);

  if (!word) {
    notFound();
  }

  const editable = !!editableWord;

  if (!editable) {
    const book = word.bookId
      ? await db.sourceBook.findUnique({ where: { id: word.bookId }, select: { title: true } })
      : null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{word.term}</h1>
          <Link href="/vocab" className={buttonVariants({ variant: "ghost" })}>
            {t("vocab.backToVocab")}
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <WordDetail
              term={word.term}
              definition={word.definition}
              definitionSi={word.definitionSi}
              exampleSentence={word.exampleSentence}
              bookTitle={book?.title}
              chapter={word.chapter}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const books = await db.sourceBook.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{word.term}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("vocab.editEntry")}</CardTitle>
        </CardHeader>
        <CardContent>
          <WordForm
            books={books}
            initial={{
              id: word.id,
              term: word.term,
              definition: word.definition ?? "",
              definitionSi: word.definitionSi ?? "",
              exampleSentence: word.exampleSentence ?? "",
              bookId: word.bookId ?? "",
              chapter: word.chapter ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
