"use client";

import { useState } from "react";
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

export function McqCard({
  item,
  index,
  total,
  onAnswered,
}: {
  item: McqItem;
  index: number;
  total: number;
  onAnswered: (wasCorrect: boolean) => void;
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
    setTimeout(() => onAnswered(wasCorrect), 900);
  }

  function handleContinue() {
    const wasCorrect = selected === item.correctAnswer;
    onAnswered(wasCorrect);
  }

  return (
    <Card>
      <CardHeader>
        <p className="text-xs text-muted-foreground">
          Question {index + 1} of {total}
        </p>
        <CardTitle className="text-xl">{item.term}</CardTitle>
        {item.exampleSentence && (
          <p className="text-sm italic text-muted-foreground">&ldquo;{item.exampleSentence}&rdquo;</p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {item.options ? (
          <>
            <div className="space-y-2">
              {item.options.map((option) => {
                const isCorrect = option === item.correctAnswer;
                const isSelected = option === selected;
                return (
                  <button
                    key={option}
                    onClick={() => handleChoice(option)}
                    disabled={revealed}
                    className={cn(
                      "w-full rounded-md border p-3 text-left text-sm transition-colors",
                      !revealed && "border-input hover:bg-accent",
                      revealed && isCorrect && "border-green-600 bg-green-50 dark:bg-green-950",
                      revealed && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                      revealed && !isSelected && !isCorrect && "border-input opacity-60"
                    )}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {revealed && (
              <Button onClick={handleContinue} className="w-full">
                Continue
              </Button>
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
                <p className="rounded-md bg-muted p-3 text-sm">
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
