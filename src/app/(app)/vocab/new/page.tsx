import { db } from "@/lib/db";
import { WordForm } from "@/components/vocab/WordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n/translate";

export default async function NewWordPage({
  searchParams,
}: {
  searchParams: Promise<{ bankId?: string }>;
}) {
  const { bankId } = await searchParams;
  const books = await db.sourceBook.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } });
  const t = await getT();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("vocab.addWordTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("vocab.newEntry")}</CardTitle>
        </CardHeader>
        <CardContent>
          <WordForm books={books} bankId={bankId} />
        </CardContent>
      </Card>
    </div>
  );
}
