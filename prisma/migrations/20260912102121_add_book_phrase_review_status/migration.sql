-- AlterTable
ALTER TABLE "book_phrases" ADD COLUMN     "is_reviewed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by_user_id" TEXT;

-- CreateIndex
CREATE INDEX "book_phrases_chapter_id_is_reviewed_idx" ON "book_phrases"("chapter_id", "is_reviewed");

-- AddForeignKey
ALTER TABLE "book_phrases" ADD CONSTRAINT "book_phrases_reviewed_by_user_id_fkey" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
