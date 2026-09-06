-- AlterEnum
ALTER TYPE "QuestionImageRole" ADD VALUE 'answer';

-- AlterTable
ALTER TABLE "exam_questions" ADD COLUMN     "explanation_video_url" TEXT;
