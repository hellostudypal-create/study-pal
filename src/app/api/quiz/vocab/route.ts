import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assembleVocabQuiz, pickDistractors } from "@/lib/quiz-assembly";
import type { VocabWord } from "@prisma/client";

const bodySchema = z.object({
  count: z.number().int().min(1).max(50).default(10),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  const count = parsed.success ? parsed.data.count : 10;

  const words = await assembleVocabQuiz(userId, count);
  if (words.length === 0) {
    return NextResponse.json(
      { error: "No vocabulary words yet — add some first." },
      { status: 400 }
    );
  }

  const items: { word: VocabWord; options: string[] | null }[] = [];
  for (const word of words) {
    const distractors = word.definition
      ? await pickDistractors(userId, word.id)
      : null;

    let options: string[] | null = null;
    if (distractors && word.definition) {
      options = [...distractors, word.definition];
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
    }

    items.push({ word, options });
  }

  const mode = items.some((i) => i.options !== null) ? "multiple_choice" : "self_graded";

  const quiz = await db.quiz.create({
    data: {
      userId,
      quizType: "vocab",
      mode,
      totalQuestions: items.length,
      items: {
        create: items.map((item, order) => ({
          vocabWordId: item.word.id,
          order,
          boxLevelBefore: item.word.boxLevel,
        })),
      },
    },
    include: { items: true },
  });

  const responseItems = quiz.items.map((quizItem, idx) => {
    const item = items[idx];
    return {
      quizItemId: quizItem.id,
      vocabWordId: item.word.id,
      term: item.word.term,
      exampleSentence: item.word.exampleSentence,
      options: item.options,
      correctAnswer: item.word.definition,
    };
  });

  return NextResponse.json({
    quiz: { id: quiz.id, mode: quiz.mode, totalQuestions: quiz.totalQuestions },
    items: responseItems,
  });
}
