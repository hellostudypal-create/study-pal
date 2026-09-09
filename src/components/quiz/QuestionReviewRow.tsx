"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/Markdown";
import { VideoEmbed } from "@/components/quiz/VideoEmbed";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface ReviewItem {
  questionText: string;
  language: "en" | "si";
  images: { id: string; role: "question" | "option" | "answer"; label: string | null; imagePath: string }[];
  options: { label: string; text: string }[] | null;
  selectedAnswer: string | null;
  correctAnswer: string | null;
  correctOptionLabel: string | null;
  answerText: string | null;
  explanationVideoUrl: string | null;
}

export function QuestionReviewRow({
  item,
  index,
  total,
}: {
  item: ReviewItem;
  index?: number;
  total?: number;
}) {
  const { t } = useTranslation();
  const textClass = item.language === "si" ? "font-sinhala" : "";
  const questionImages = item.images.filter((img) => img.role === "question");
  const answerImages = item.images.filter((img) => img.role === "answer");
  const wasCorrect = item.selectedAnswer !== null && item.selectedAnswer === item.correctAnswer;
  const wasAnswered = item.selectedAnswer !== null;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3.5 p-5">
        <div className="flex items-center gap-2">
          {index !== undefined && total !== undefined && (
            <span className="inline-flex w-fit items-center rounded-full bg-primary-tint px-3 py-1 text-xs font-bold text-primary">
              {t("quizPlay.questionOfTotal", { index: index + 1, total })}
            </span>
          )}
          <Badge variant={!wasAnswered ? "outline" : wasCorrect ? "default" : "destructive"}>
            {!wasAnswered ? t("quizPlay.unanswered") : wasCorrect ? t("quizPlay.correct") : t("quizPlay.notQuite")}
          </Badge>
        </div>

        <p className={cn("text-base font-semibold", textClass)}>{item.questionText}</p>
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

        {item.options && (
          <div className="space-y-2">
            {item.options.map((option) => {
              const isCorrect = option.text === item.correctAnswer;
              const isSelected = option.text === item.selectedAnswer;
              return (
                <div
                  key={option.label}
                  className={cn(
                    "flex items-center gap-3 rounded-sm border-[1.5px] p-3 text-sm font-medium",
                    isCorrect && "border-success bg-success-tint",
                    isSelected && !isCorrect && "border-destructive bg-destructive-tint",
                    !isCorrect && !isSelected && "border-border opacity-60"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border text-xs font-bold",
                      isCorrect && "border-success bg-success text-white",
                      isSelected && !isCorrect && "border-destructive bg-destructive text-white"
                    )}
                  >
                    {isCorrect ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : isSelected ? (
                      <X className="h-3.5 w-3.5" />
                    ) : (
                      option.label
                    )}
                  </span>
                  <span className={textClass}>{option.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {(item.answerText || answerImages.length > 0 || item.explanationVideoUrl) && (
          <div className="space-y-3 rounded-sm bg-muted p-3.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{t("quizPlay.answer")}</span>
              {item.correctOptionLabel && (
                <Badge variant="outline">{t("quizPlay.optionLabel", { label: item.correctOptionLabel })}</Badge>
              )}
            </div>
            {item.answerText && <Markdown className={textClass}>{item.answerText}</Markdown>}
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
        )}
      </CardContent>
    </Card>
  );
}
