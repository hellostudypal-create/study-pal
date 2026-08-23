"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface SelfGradeItem {
  quizItemId: string;
  questionText: string;
  answerText: string;
  language: "en" | "si";
  correctOptionLabel: string | null;
  images: { id: string; role: "question" | "option"; label: string | null; imagePath: string }[];
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
  onAnswered: (wasCorrect: boolean) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  const textClass = item.language === "si" ? "font-sinhala" : "";

  const questionImages = item.images.filter((img) => img.role === "question");
  const optionImages = item.images.filter((img) => img.role === "option");

  return (
    <Card>
      <CardHeader>
        <p className="text-xs text-muted-foreground">
          Question {index + 1} of {total}
        </p>
        <p className={cn("text-lg font-medium", textClass)}>{item.questionText}</p>
      </CardHeader>
      <CardContent className="space-y-4">
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
        {optionImages.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {optionImages.map((img) => (
              <div key={img.id} className="space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/uploads/questions/${img.imagePath}`}
                  alt={img.label ?? "Option"}
                  className={cn(
                    "aspect-square rounded-md border object-contain bg-muted",
                    revealed && img.label === item.correctOptionLabel
                      ? "border-green-600"
                      : "border-border"
                  )}
                />
                <p className="text-center text-xs text-muted-foreground">Option {img.label}</p>
              </div>
            ))}
          </div>
        )}

        {!revealed ? (
          <Button onClick={() => setRevealed(true)} className="w-full">
            Show answer
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="rounded-md bg-muted p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Answer</span>
                {item.correctOptionLabel && <Badge variant="outline">Option {item.correctOptionLabel}</Badge>}
              </div>
              <p className={cn("mt-1 text-sm", textClass)}>{item.answerText}</p>
            </div>
            <div className="flex gap-3">
              <Button variant="destructive" className="flex-1" onClick={() => onAnswered(false)}>
                I got it wrong
              </Button>
              <Button className="flex-1" onClick={() => onAnswered(true)}>
                I got it right
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
