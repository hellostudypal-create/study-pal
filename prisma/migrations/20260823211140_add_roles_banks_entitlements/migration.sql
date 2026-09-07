/*
  Warnings:

  - Added the required column `bank_id` to the `exam_questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bank_id` to the `vocab_words` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('customer', 'content_editor', 'admin');

-- CreateEnum
CREATE TYPE "BankKind" AS ENUM ('exam', 'vocab');

-- CreateEnum
CREATE TYPE "ExamCategory" AS ENUM ('IQ', 'Grade5Scholarship', 'OL', 'AL', 'GovAdmin', 'Other');

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('personal', 'manual_grant', 'promo');

-- DropForeignKey
ALTER TABLE "exam_questions" DROP CONSTRAINT "exam_questions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "vocab_words" DROP CONSTRAINT "vocab_words_user_id_fkey";

-- DropIndex
DROP INDEX "exam_questions_user_id_next_review_at_idx";

-- DropIndex
DROP INDEX "vocab_words_user_id_next_review_at_idx";

-- AlterTable
-- bank_id starts nullable: the table isn't empty, so we backfill it below
-- before a later migration makes it required.
ALTER TABLE "exam_questions" ADD COLUMN     "bank_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'customer';

-- AlterTable
ALTER TABLE "vocab_words" ADD COLUMN     "bank_id" TEXT,
ALTER COLUMN "user_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "banks" (
    "id" TEXT NOT NULL,
    "kind" "BankKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "exam_category" "ExamCategory",
    "theme" TEXT,
    "price" DECIMAL(10,2),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_personal" BOOLEAN NOT NULL DEFAULT false,
    "owner_user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_editors" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_editors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "bank_id" TEXT NOT NULL,
    "source" "EntitlementSource" NOT NULL DEFAULT 'manual_grant',
    "granted_by_user_id" TEXT,
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "banks_kind_is_published_is_personal_idx" ON "banks"("kind", "is_published", "is_personal");

-- CreateIndex
CREATE UNIQUE INDEX "bank_editors_user_id_bank_id_key" ON "bank_editors"("user_id", "bank_id");

-- CreateIndex
CREATE INDEX "entitlements_user_id_idx" ON "entitlements"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_user_id_bank_id_key" ON "entitlements"("user_id", "bank_id");

-- CreateIndex
CREATE INDEX "exam_questions_bank_id_next_review_at_idx" ON "exam_questions"("bank_id", "next_review_at");

-- CreateIndex
CREATE INDEX "vocab_words_bank_id_next_review_at_idx" ON "vocab_words"("bank_id", "next_review_at");

-- AddForeignKey
ALTER TABLE "banks" ADD CONSTRAINT "banks_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_editors" ADD CONSTRAINT "bank_editors_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_editors" ADD CONSTRAINT "bank_editors_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_granted_by_user_id_fkey" FOREIGN KEY ("granted_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vocab_words" ADD CONSTRAINT "vocab_words_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: give every existing user a personal exam bank and a personal
-- vocab bank, move their existing content into those banks, and grant them
-- an entitlement to each. Existing rows all have a non-null user_id at this
-- point in history, so this fully populates bank_id before the follow-up
-- migration makes the column required.
INSERT INTO "banks" ("id", "kind", "title", "is_published", "is_personal", "owner_user_id", "created_at", "updated_at")
SELECT gen_random_uuid(), 'exam', COALESCE("display_name", "email") || '''s Questions', false, true, "id", now(), now()
FROM "users";

INSERT INTO "banks" ("id", "kind", "title", "is_published", "is_personal", "owner_user_id", "created_at", "updated_at")
SELECT gen_random_uuid(), 'vocab', COALESCE("display_name", "email") || '''s Vocabulary', false, true, "id", now(), now()
FROM "users";

UPDATE "exam_questions" AS eq
SET "bank_id" = b."id"
FROM "banks" AS b
WHERE b."owner_user_id" = eq."user_id" AND b."kind" = 'exam' AND b."is_personal" = true;

UPDATE "vocab_words" AS vw
SET "bank_id" = b."id"
FROM "banks" AS b
WHERE b."owner_user_id" = vw."user_id" AND b."kind" = 'vocab' AND b."is_personal" = true;

INSERT INTO "entitlements" ("id", "user_id", "bank_id", "source", "granted_at")
SELECT gen_random_uuid(), "owner_user_id", "id", 'personal', now()
FROM "banks" WHERE "is_personal" = true;
