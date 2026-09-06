"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuizLayout } from "@/components/quiz/QuizLayout";
import type { QuizAnswerResult } from "@/components/quiz/types";

export interface McqItem {
  quizItemId: string;
  term: string;
  exampleSentence: string | null;
  options: string[] | null;
  correctAnswer: string | null;
}

export function McqCard({
  item,
  index,
  total,
  onAnswered,
}: {
  item: McqItem;
  index: number;
  total: number;
  onAnswered: (result: QuizAnswerResult) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [typed, setTyped] = useState("");
  const [revealed, setRevealed] = useState(false);

  function handleChoice(option: string) {
    if (revealed) return;
    setSelected(option);
    setRevealed(true);
  }

  function handleTypedSubmit(wasCorrect: boolean) {
    setTimeout(() => onAnswered({ kind: "self_assessed", wasCorrect }), 900);
  }

  function handleContinue() {
    onAnswered({ kind: "verified_choice", selectedAnswer: selected! });
  }

  const wasCorrect = selected === item.correctAnswer;

  const prompt = (
    <>
      <h2 className="text-2xl font-extrabold">{item.term}</h2>
      {item.exampleSentence && (
        <p className="text-sm italic text-muted-foreground">&ldquo;{item.exampleSentence}&rdquo;</p>
      )}
    </>
  );

  const solution = revealed ? (
    <div className="rounded-sm bg-muted p-3.5">
      <span className="text-sm font-semibold">Definition</span>
      <p className="mt-1 text-sm">{item.correctAnswer}</p>
    </div>
  ) : null;

  const answerArea = item.options ? (
    <>
      <div className="space-y-2.5">
        {item.options.map((option) => {
          const isCorrect = option === item.correctAnswer;
          const isSelected = option === selected;
          return (
            <button
              key={option}
              onClick={() => handleChoice(option)}
              disabled={revealed}
              className={cn(
                "flex w-full items-center gap-3 rounded-sm border-[1.5px] p-3.5 text-left text-sm font-medium transition-all",
                !revealed && "border-border hover:border-primary hover:bg-primary-tint",
                revealed && isCorrect && "border-success bg-success-tint",
                revealed && isSelected && !isCorrect && "border-destructive bg-destructive-tint",
                revealed && !isSelected && !isCorrect && "border-border opacity-45"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border text-white",
                  revealed && isCorrect && "border-success bg-success",
                  revealed && isSelected && !isCorrect && "border-destructive bg-destructive"
                )}
              >
                {revealed && isCorrect && <Check className="h-3.5 w-3.5" />}
                {revealed && isSelected && !isCorrect && <X className="h-3.5 w-3.5" />}
              </span>
              {option}
            </button>
          );
        })}
      </div>
      {revealed && (
        <>
          <div
            className={cn(
              "flex animate-rise-in items-center gap-3 rounded-md border p-3.5",
              wasCorrect ? "border-success/35 bg-success-tint" : "border-destructive/35 bg-destructive-tint"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white",
                wasCorrect ? "bg-success shadow-[0_0_0_6px_hsl(var(--success)/0.16)]" : "bg-destructive shadow-[0_0_0_6px_hsl(var(--destructive)/0.16)]"
              )}
            >
              {wasCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            </span>
            <span className="text-sm font-semibold">{wasCorrect ? "Correct!" : "Not quite"}</span>
          </div>
          <Button onClick={handleContinue} className="w-full">
            Continue
          </Button>
        </>
      )}
    </>
  ) : (
    <>
      <Input
        placeholder="Type the definition"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        disabled={revealed}
      />
      {!revealed ? (
        <Button onClick={() => setRevealed(true)} className="w-full" disabled={!typed}>
          Reveal answer
        </Button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Check the Solution tab, then grade yourself.</p>
          <div className="flex gap-3">
            <Button variant="destructive" className="flex-1" onClick={() => handleTypedSubmit(false)}>
              I got it wrong
            </Button>
            <Button className="flex-1" onClick={() => handleTypedSubmit(true)}>
              I got it right
            </Button>
          </div>
        </div>
      )}
    </>
  );

  return (
    <QuizLayout
      index={index}
      total={total}
      prompt={prompt}
      solution={solution}
      answerArea={answerArea}
      answerAreaLabel={item.options ? "Choose an answer" : "Your answer"}
    />
  );
}
