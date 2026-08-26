import { db } from "@/lib/db";
import { WordForm } from "@/components/vocab/WordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewWordPage({
  searchParams,
}: {
  searchParams: Promise<{ bankId?: string }>;
}) {
  const { bankId } = await searchParams;
  const books = await db.book.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Add a word</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New vocabulary entry</CardTitle>
        </CardHeader>
        <CardContent>
          <WordForm books={books} bankId={bankId} />
        </CardContent>
      </Card>
    </div>
  );
}
