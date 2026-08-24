"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface McqItem {
  quizItemId: string;
  term: string;
  exampleSentence: string | null;
  options: string[] | null;
  correctAnswer: string | null;
}

export type McqAnswerResult =
  | { kind: "verified_choice"; selectedAnswer: string }
  | { kind: "self_assessed"; wasCorrect: boolean };

export function McqCard({
  item,
  index,
  total,
  onAnswered,
}: {
  item: McqItem;
  index: number;
  total: number;
  onAnswered: (result: McqAnswerResult) => void;
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
    setRevealed(true);
    setTimeout(() => onAnswered({ kind: "self_assessed", wasCorrect }), 900);
  }

  function handleContinue() {
    onAnswered({ kind: "verified_choice", selectedAnswer: selected! });
  }

  const wasCorrect = selected === item.correctAnswer;

  return (
    <Card>
      <CardHeader>
        <span className="inline-flex w-fit items-center rounded-full bg-primary-tint px-3 py-1 text-xs font-bold text-primary">
          Question {index + 1} of {total}
        </span>
        <CardTitle className="text-2xl font-extrabold">{item.term}</CardTitle>
        {item.exampleSentence && (
          <p className="text-sm italic text-muted-foreground">&ldquo;{item.exampleSentence}&rdquo;</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {item.options ? (
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
                <p className="rounded-sm bg-muted p-3 text-sm">
                  <span className="font-medium">Correct answer: </span>
                  {item.correctAnswer}
                </p>
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
        )}
      </CardContent>
    </Card>
  );
}
