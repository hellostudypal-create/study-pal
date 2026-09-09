-- CreateEnum
CREATE TYPE "QuizSessionMode" AS ENUM ('practice', 'exam');

-- AlterTable
ALTER TABLE "banks" ADD COLUMN     "exam_time_limit_minutes" INTEGER,
ADD COLUMN     "standard_exam_question_count" INTEGER;

-- AlterTable
ALTER TABLE "quiz_items" ADD COLUMN     "selected_answer" TEXT;

-- AlterTable
ALTER TABLE "quizzes" ADD COLUMN     "bank_id" TEXT,
ADD COLUMN     "session_mode" "QuizSessionMode" NOT NULL DEFAULT 'practice',
ADD COLUMN     "set_index" INTEGER,
ADD COLUMN     "time_limit_seconds" INTEGER;

-- CreateIndex
CREATE INDEX "quizzes_bank_id_session_mode_set_index_idx" ON "quizzes"("bank_id", "session_mode", "set_index");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_bank_id_fkey" FOREIGN KEY ("bank_id") REFERENCES "banks"("id") ON DELETE SET NULL ON UPDATE CASCADE;
