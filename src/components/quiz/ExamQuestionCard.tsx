"use client";

import { cn } from "@/lib/utils";
import { QuizLayout } from "@/components/quiz/QuizLayout";
import type { SelfGradeItem } from "@/components/quiz/SelfGradeCard";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function ExamQuestionCard({
  item,
  index,
  total,
  selected,
  onSelect,
}: {
  item: SelfGradeItem;
  index: number;
  total: number;
  selected: string | null;
  onSelect: (optionText: string) => void;
}) {
  const { t } = useTranslation();
  const textClass = item.language === "si" ? "font-sinhala" : "";
  const questionImages = item.images.filter((img) => img.role === "question");
  const optionImages = item.images.filter((img) => img.role === "option");

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
                className="aspect-square rounded-md border-[1.5px] border-border object-contain bg-muted"
              />
              <p className="text-center text-xs text-muted-foreground">
                {t("quizPlay.optionLabel", { label: img.label ?? "" })}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2.5">
        {item.options.map((option) => {
          const isSelected = option.text === selected;
          return (
            <button
              key={option.label}
              type="button"
              onClick={() => onSelect(option.text)}
              className={cn(
                "flex w-full items-center gap-3 rounded-sm border-[1.5px] p-3.5 text-left text-sm font-medium transition-all",
                isSelected ? "border-primary bg-primary-tint" : "border-border hover:border-primary hover:bg-primary-tint"
              )}
            >
              <span
                className={cn(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-[1.5px] text-xs font-bold",
                  isSelected ? "border-primary bg-primary text-white" : "border-border"
                )}
              >
                {option.label}
              </span>
              <span className={textClass}>{option.text}</span>
            </button>
          );
        })}
      </div>
    </>
  ) : null;

  return (
    <QuizLayout
      index={index}
      total={total}
      prompt={prompt}
      solution={null}
      answerArea={answerArea}
      answerAreaLabel={t("quizPlay.chooseAnswer")}
    />
  );
}
