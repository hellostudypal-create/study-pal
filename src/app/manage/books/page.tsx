import Link from "next/link";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ManageBooksPage() {
  const books = await db.book.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chapters: true, entitlements: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Books</h1>
        <Link href="/manage/books/new" className={buttonVariants()}>
          + New book
        </Link>
      </div>

      {books.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No books yet — create one to start selling.
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Chapters</th>
                  <th className="px-4 py-3">Access</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      <Link href={`/manage/books/${book.id}`} className="hover:underline">
                        {book.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{book.author ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {book.price != null ? `Rs. ${Number(book.price).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{book._count.chapters}</td>
                    <td className="px-4 py-3 text-muted-foreground">{book._count.entitlements}</td>
                    <td className="px-4 py-3">
                      <Badge variant={book.isPublished ? "default" : "outline"}>
                        {book.isPublished ? "Published" : "Draft"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
