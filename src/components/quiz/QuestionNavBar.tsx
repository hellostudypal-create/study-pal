"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function QuestionNavBar({
  total,
  index,
  answered,
  maxIndex,
  onJump,
  onPrev,
  onNext,
  showJumpGrid = true,
  onSubmit,
  submitting,
}: {
  total: number;
  index: number;
  answered: boolean[];
  maxIndex: number;
  onJump: (i: number) => void;
  onPrev: () => void;
  onNext: () => void;
  showJumpGrid?: boolean;
  onSubmit?: () => void;
  submitting?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Button variant="outline" disabled={index <= 0} onClick={onPrev}>
          {t("common.previous")}
        </Button>
        {onSubmit && (
          <Button variant="destructive" onClick={onSubmit} disabled={submitting}>
            {submitting ? t("quizPlay.submitting") : t("quizPlay.submitExam")}
          </Button>
        )}
        <Button variant="outline" disabled={index >= maxIndex} onClick={onNext}>
          {t("common.next")}
        </Button>
      </div>
      {showJumpGrid && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              disabled={i > maxIndex}
              onClick={() => onJump(i)}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-md border-[1.5px] text-xs font-bold transition-colors",
                i === index && "ring-2 ring-primary/50",
                answered[i] ? "border-success bg-success-tint" : "border-border bg-muted",
                i > maxIndex && "cursor-not-allowed opacity-40"
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
