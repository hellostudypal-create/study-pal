import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { SourceBookForm } from "@/components/books/SourceBookForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SourceBookDetailPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const book = await db.sourceBook.findUnique({ where: { id: bookId } });
  if (!book) notFound();

  const words = await db.vocabWord.findMany({
    where: { bookId },
    orderBy: { term: "asc" },
    select: { id: true, term: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{book.title}</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SourceBookForm
            initial={{
              id: book.id,
              title: book.title,
              author: book.author ?? "",
              description: book.description ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Words from this book ({words.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {words.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No words assigned to this book yet — pick it from the book field when adding or editing a word.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border">
              {words.map((word) => (
                <li key={word.id} className="p-3 text-sm">
                  <Link href={`/vocab/${word.id}`} className="hover:underline">
                    {word.term}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
