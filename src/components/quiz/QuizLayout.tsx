"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function QuizLayout({
  index,
  total,
  prompt,
  solution,
  answerArea,
  answerAreaLabel,
}: {
  index: number;
  total: number;
  prompt: React.ReactNode;
  solution: React.ReactNode | null;
  answerArea: React.ReactNode;
  answerAreaLabel?: string;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"question" | "solution">("question");

  useEffect(() => {
    setTab("question");
  }, [index]);

  useEffect(() => {
    if (solution) setTab("solution");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solution !== null]);

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-1 border-b border-border px-4">
          <TabButton active={tab === "question"} onClick={() => setTab("question")}>
            {t("quizPlay.questionTab")}
          </TabButton>
          <TabButton active={tab === "solution"} disabled={!solution} onClick={() => solution && setTab("solution")}>
            {t("quizPlay.solutionTab")}
          </TabButton>
        </div>
        <CardContent className="space-y-3 p-5">
          <span className="inline-flex w-fit items-center rounded-full bg-primary-tint px-3 py-1 text-xs font-bold text-primary">
            {t("quizPlay.questionOfTotal", { index: index + 1, total })}
          </span>
          {tab === "question" ? prompt : solution}
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {answerAreaLabel ?? t("quizPlay.yourAnswer")}
          </span>
        </div>
        <CardContent className="space-y-3 p-5">{answerArea}</CardContent>
      </Card>
    </div>
  );
}

function TabButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "border-b-2 px-3 py-3 text-sm font-semibold transition-colors",
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
        disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}
