import Link from "next/link";
import { Library } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getEntitledBookIds } from "@/lib/authz";
import { bankCardClassName, BankCardContent } from "@/components/quiz/BankCard";
import { getT } from "@/lib/i18n/translate";

export default async function BooksPage() {
  const userId = await getCurrentUserId();
  const t = await getT();

  const bookIds = userId ? await getEntitledBookIds(userId) : [];
  const books = bookIds.length
    ? await db.book.findMany({
        where: { id: { in: bookIds } },
        orderBy: { title: "asc" },
        include: { _count: { select: { chapters: true } } },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("books.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("books.subtitle")}</p>
      </div>

      {books.length === 0 ? (
        <p className="text-muted-foreground">{t("books.empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {books.map((book) => (
            <Link key={book.id} href={`/books/${book.id}`} className={bankCardClassName}>
              <BankCardContent
                bank={{
                  id: book.id,
                  title: book.title,
                  subtitle: book.author,
                  count: book._count.chapters,
                  countLabel: t("books.chaptersCount"),
                  coverImageUrl: book.coverImageUrl,
                }}
                icon={Library}
                accentClassName="bg-brand"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
