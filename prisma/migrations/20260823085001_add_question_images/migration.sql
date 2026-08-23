-- CreateEnum
CREATE TYPE "QuestionImageRole" AS ENUM ('question', 'option');

-- AlterTable
ALTER TABLE "exam_questions" ADD COLUMN     "correct_option_label" TEXT;

-- CreateTable
CREATE TABLE "question_images" (
    "id" TEXT NOT NULL,
    "exam_question_id" TEXT NOT NULL,
    "role" "QuestionImageRole" NOT NULL DEFAULT 'question',
    "label" TEXT,
    "image_path" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "question_images_exam_question_id_idx" ON "question_images"("exam_question_id");

-- AddForeignKey
ALTER TABLE "question_images" ADD CONSTRAINT "question_images_exam_question_id_fkey" FOREIGN KEY ("exam_question_id") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
