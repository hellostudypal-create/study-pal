import Link from "next/link";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function ManageSourceBooksPage() {
  const books = await db.sourceBook.findMany({
    orderBy: { title: "asc" },
    include: { _count: { select: { words: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Source books</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Citation tags for vocab words ("From: Alice in Wonderland") — not the sellable Books catalog, see{" "}
            <Link href="/manage/books" className="underline">
              Manage → Books
            </Link>
            .
          </p>
        </div>
        <Link href="/manage/source-books/new" className={buttonVariants()}>
          + New source book
        </Link>
      </div>

      {books.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No source books yet — add one to start organizing vocabulary by source.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {books.map((book) => (
            <Link key={book.id} href={`/manage/source-books/${book.id}`}>
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <h3 className="font-semibold">{book.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {book.author ? `${book.author} · ` : ""}
                      {book._count.words} {book._count.words === 1 ? "word" : "words"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
