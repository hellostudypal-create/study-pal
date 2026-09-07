"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/Markdown";
import { QuizLayout } from "@/components/quiz/QuizLayout";
import { VideoEmbed } from "@/components/quiz/VideoEmbed";
import type { QuizAnswerResult } from "@/components/quiz/types";

export interface SelfGradeItem {
  quizItemId: string;
  questionText: string;
  answerText: string;
  language: "en" | "si";
  correctOptionLabel: string | null;
  explanationVideoUrl: string | null;
  images: { id: string; role: "question" | "option" | "answer"; label: string | null; imagePath: string }[];
  options: { label: string; text: string }[] | null;
  correctAnswer: string | null;
}

export function SelfGradeCard({
  item,
  index,
  total,
  onAnswered,
}: {
  item: SelfGradeItem;
  index: number;
  total: number;
  onAnswered: (result: QuizAnswerResult) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const textClass = item.language === "si" ? "font-sinhala" : "";

  const questionImages = item.images.filter((img) => img.role === "question");
  const optionImages = item.images.filter((img) => img.role === "option");
  const answerImages = item.images.filter((img) => img.role === "answer");

  function handleChoice(optionText: string) {
    if (revealed) return;
    setSelected(optionText);
    setRevealed(true);
  }

  function handleContinue() {
    onAnswered({ kind: "verified_choice", selectedAnswer: selected! });
  }

  const wasCorrect = selected === item.correctAnswer;

  const prompt = (
    <>
      <p className={cn("text-lg font-semibold", textClass)}>{item.questionText}</p>
      {questionImages.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {questionImages.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={`/api/uploads/questions/${img.imagePath}`}
              alt="Question figure"
              className="rounded-md border border-border bg-muted object-contain"
            />
          ))}
        </div>
      )}
    </>
  );

  const solution = revealed ? (
    <div className="space-y-3 rounded-sm bg-muted p-3.5">
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold">Answer</span>
        {item.correctOptionLabel && <Badge variant="outline">Option {item.correctOptionLabel}</Badge>}
      </div>
      <Markdown className={textClass}>{item.answerText}</Markdown>
      {answerImages.length > 0 && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {answerImages.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={`/api/uploads/questions/${img.imagePath}`}
              alt="Solution figure"
              className="rounded-md border border-border bg-muted object-contain"
            />
          ))}
        </div>
      )}
      {item.explanationVideoUrl && <VideoEmbed url={item.explanationVideoUrl} />}
    </div>
  ) : null;

  const answerArea = item.options ? (
    <>
      {optionImages.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {optionImages.map((img) => (
            <div key={img.id} className="space-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/questions/${img.imagePath}`}
                alt={img.label ?? "Option"}
                className={cn(
                  "aspect-square rounded-md border-[1.5px] object-contain bg-muted",
                  revealed && img.label === item.correctOptionLabel ? "border-success" : "border-border"
                )}
              />
              <p className="text-center text-xs text-muted-foreground">Option {img.label}</p>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2.5">
        {item.options.map((option) => {
          const isCorrect = option.text === item.correctAnswer;
          const isSelected = option.text === selected;
          return (
            <button
              key={option.label}
              onClick={() => handleChoice(option.text)}
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
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border text-xs font-bold",
                  revealed && isCorrect && "border-success bg-success text-white",
                  revealed && isSelected && !isCorrect && "border-destructive bg-destructive text-white"
                )}
              >
                {revealed && isCorrect ? (
                  <Check className="h-3.5 w-3.5" />
                ) : revealed && isSelected ? (
                  <X className="h-3.5 w-3.5" />
                ) : (
                  option.label
                )}
              </span>
              <span className={textClass}>{option.text}</span>
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
                wasCorrect
                  ? "bg-success shadow-[0_0_0_6px_hsl(var(--success)/0.16)]"
                  : "bg-destructive shadow-[0_0_0_6px_hsl(var(--destructive)/0.16)]"
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
  ) : !revealed ? (
    <Button onClick={() => setRevealed(true)} className="w-full">
      Show answer
    </Button>
  ) : (
    <div className="flex gap-3">
      <Button
        variant="destructive"
        className="flex-1"
        onClick={() => onAnswered({ kind: "self_assessed", wasCorrect: false })}
      >
        I got it wrong
      </Button>
      <Button className="flex-1" onClick={() => onAnswered({ kind: "self_assessed", wasCorrect: true })}>
        I got it right
      </Button>
    </div>
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
