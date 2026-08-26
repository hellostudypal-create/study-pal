-- Promote vocab_words.source_book from a loose free-text string into a
-- first-class Book relation, so vocab can be organized/filtered by book
-- and books can be managed in the admin. Back-fills one Book row per
-- distinct existing source_book value before dropping the old column.

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "vocab_words" ADD COLUMN "book_id" TEXT;

-- Backfill: one Book per distinct non-blank source_book value
INSERT INTO "books" ("id", "title", "created_at", "updated_at")
SELECT gen_random_uuid()::text, distinct_titles."source_book", now(), now()
FROM (
    SELECT DISTINCT "source_book"
    FROM "vocab_words"
    WHERE "source_book" IS NOT NULL AND trim("source_book") <> ''
) AS distinct_titles;

UPDATE "vocab_words" AS vw
SET "book_id" = b."id"
FROM "books" AS b
WHERE vw."source_book" = b."title";

-- AlterTable
ALTER TABLE "vocab_words" DROP COLUMN "source_book";

-- AddForeignKey
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "vocab_words_book_id_idx" ON "vocab_words"("book_id");
