import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEntitledBookIds } from "@/lib/authz";
import { buildWhatsAppLink } from "@/lib/config";
import { PhraseCard } from "@/components/books/PhraseCard";
import { Markdown } from "@/components/ui/Markdown";
import { getT } from "@/lib/i18n/translate";

export default async function StoreBookPage({
  params,
}: {
  params: Promise<{ bookId: string }>;
}) {
  const { bookId } = await params;
  const t = await getT();
  const book = await db.book.findUnique({
    where: { id: bookId },
    include: { chapters: { orderBy: { order: "asc" } } },
  });

  if (!book || !book.isPublished) {
    notFound();
  }

  const session = await auth();
  const owned = session?.user ? (await getEntitledBookIds(session.user.id)).includes(book.id) : false;

  // Cap each free-preview chapter to book.previewPhraseLimit phrases - a
  // per-chapter take, not a total, so multiple preview chapters each get
  // their own taste rather than the limit being split across all of them.
  const previewChapters = book.chapters.filter((c) => c.isFreePreview);
  const previewData = await Promise.all(
    previewChapters.map(async (chapter) => {
      const [phrases, totalCount] = await Promise.all([
        db.bookPhrase.findMany({
          where: { chapterId: chapter.id },
          orderBy: { order: "asc" },
          take: book.previewPhraseLimit,
        }),
        db.bookPhrase.count({ where: { chapterId: chapter.id } }),
      ]);
      return { chapterId: chapter.id, phrases, totalCount };
    })
  );
  const previewByChapter = new Map(previewData.map((d) => [d.chapterId, d]));

  return (
    <div className="space-y-6">
      <Link href="/store" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
        {t("store.backToBanks")}
      </Link>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {book.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={book.coverImageUrl} alt="" className="h-48 w-full object-cover sm:h-64" />
        )}
        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold text-primary">
                {t("store.books")}
              </span>
              <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{book.title}</h1>
              {book.author && <p className="mt-0.5 text-muted-foreground">{book.author}</p>}
            </div>
            {book.price != null && (
              <span className="shrink-0 text-2xl font-extrabold text-primary">
                Rs. {Number(book.price).toLocaleString()}
              </span>
            )}
          </div>

          {book.description && <Markdown className="mt-4 text-sm text-muted-foreground">{book.description}</Markdown>}

          <p className="mt-4 text-sm font-medium">
            {book.chapters.length} {t("store.chaptersCount")}
          </p>

          <div className="mt-6">
            {owned ? (
              <Link
                href={`/books/${book.id}`}
                className="inline-flex rounded-md bg-success px-5 py-2.5 text-sm font-semibold text-white hover:bg-success/90"
              >
                {t("books.readNow")}
              </Link>
            ) : (
              <a
                href={buildWhatsAppLink(book.title)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                {t("store.interestedWhatsApp")}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">{t("books.chaptersHeading")}</h2>
        {book.chapters.map((chapter) => (
          <div key={chapter.id} className="space-y-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2">
                <h3 className="font-bold">{chapter.title}</h3>
                {!chapter.isFreePreview && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              {chapter.subtitle && <p className="mt-1 text-sm text-muted-foreground">{chapter.subtitle}</p>}
              {!chapter.isFreePreview && (
                <p className="mt-2 text-xs font-semibold text-primary">{t("books.unlockWithPurchase")}</p>
              )}
            </div>
            {chapter.isFreePreview && (
              <div className="space-y-3 pl-4">
                {(previewByChapter.get(chapter.id)?.phrases ?? []).map((phrase) => (
                  <PhraseCard key={phrase.id} phrase={phrase} />
                ))}
                {(() => {
                  const preview = previewByChapter.get(chapter.id);
                  const remaining = preview ? preview.totalCount - preview.phrases.length : 0;
                  return remaining > 0 ? (
                    <p className="text-xs font-semibold text-primary">
                      {t("books.morePhrasesLocked", { count: remaining })}
                    </p>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
