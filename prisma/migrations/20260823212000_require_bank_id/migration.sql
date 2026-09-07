-- Run only after confirming the backfill in the prior migration populated
-- bank_id on every row (verified against a production data snapshot before
-- this shipped).
ALTER TABLE "exam_questions" ALTER COLUMN "bank_id" SET NOT NULL;
ALTER TABLE "vocab_words" ALTER COLUMN "bank_id" SET NOT NULL;
