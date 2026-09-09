-- Rename the old citation-tag table (used only to label a vocab word's
-- source, e.g. "From: Alice in Wonderland") to source_books, preserving its
-- data, so a brand-new "books" table can be created below for the sellable
-- Book product. Hand-written instead of using Prisma's auto-generated diff:
-- the diff engine saw both the old and new models mapped to "books" and
-- tried to reuse the physical table for the new model while creating an
-- EMPTY "source_books" table, orphaning the existing rows and breaking the
-- vocab_words.book_id foreign key. A real rename avoids that entirely.
ALTER TABLE "vocab_words" DROP CONSTRAINT "vocab_words_book_id_fkey";
ALTER TABLE "books" RENAME TO "source_books";
ALTER TABLE "source_books" RENAME CONSTRAINT "books_pkey" TO "source_books_pkey";

-- CreateTable
CREATE TABLE "books" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "description" TEXT,
    "cover_image_url" TEXT,
    "price" DECIMAL(10,2),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "quiz_bank_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_chapters" (
    "id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "cover_image_url" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_free_preview" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_phrases" (
    "id" TEXT NOT NULL,
    "chapter_id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "translation_si" TEXT,
    "explanation" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_phrases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_entitlements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "source" "EntitlementSource" NOT NULL DEFAULT 'manual_grant',
    "granted_by_user_id" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "book_entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "book_chapters_book_id_order_idx" ON "book_chapters"("book_id", "order");

-- CreateIndex
CREATE INDEX "book_phrases_chapter_id_order_idx" ON "book_phrases"("chapter_id", "order");

-- CreateIndex
CREATE INDEX "book_entitlements_user_id_idx" ON "book_entitlements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_entitlements_user_id_book_id_key" ON "book_entitlements"("user_id", "book_id");

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_quiz_bank_id_fkey" FOREIGN KEY ("quiz_bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_chapters" ADD CONSTRAINT "book_chapters_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_phrases" ADD CONSTRAINT "book_phrases_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "book_chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_entitlements" ADD CONSTRAINT "book_entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_entitlements" ADD CONSTRAINT "book_entitlements_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_entitlements" ADD CONSTRAINT "book_entitlements_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_book_id_fkey" FOREIGN KEY ("book_id") REFERENCES "source_books"("id") ON DELETE SET NULL ON UPDATE CASCADE;
