-- CreateEnum
CREATE TYPE "AnswerKind" AS ENUM ('verified_choice', 'self_assessed');

-- AlterTable
ALTER TABLE "quiz_items" ADD COLUMN     "answer_kind" "AnswerKind" NOT NULL DEFAULT 'self_assessed';

-- CreateTable
CREATE TABLE "exam_question_options" (
    "id" TEXT NOT NULL,
    "exam_question_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "is_correct" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "exam_question_options_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exam_question_options_exam_question_id_idx" ON "exam_question_options"("exam_question_id");

-- AddForeignKey
ALTER TABLE "exam_question_options" ADD CONSTRAINT "exam_question_options_exam_question_id_fkey" FOREIGN KEY ("exam_question_id") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
