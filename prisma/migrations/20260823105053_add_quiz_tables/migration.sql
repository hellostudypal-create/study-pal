-- CreateEnum
CREATE TYPE "QuizType" AS ENUM ('vocab', 'exam');

-- CreateEnum
CREATE TYPE "QuizMode" AS ENUM ('multiple_choice', 'self_graded');

-- CreateTable
CREATE TABLE "quizzes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "quiz_type" "QuizType" NOT NULL,
    "mode" "QuizMode" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "total_questions" INTEGER NOT NULL,
    "points_earned" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quiz_items" (
    "id" TEXT NOT NULL,
    "quiz_id" TEXT NOT NULL,
    "vocab_word_id" TEXT,
    "exam_question_id" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "was_correct" BOOLEAN,
    "box_level_before" INTEGER NOT NULL,
    "box_level_after" INTEGER,
    "points_awarded" INTEGER NOT NULL DEFAULT 0,
    "answered_at" TIMESTAMP(3),

    CONSTRAINT "quiz_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quizzes_user_id_started_at_idx" ON "quizzes"("user_id", "started_at");

-- CreateIndex
CREATE INDEX "quiz_items_quiz_id_idx" ON "quiz_items"("quiz_id");

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_items" ADD CONSTRAINT "quiz_items_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
