"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Markdown } from "@/components/ui/Markdown";
import { VideoEmbed } from "@/components/quiz/VideoEmbed";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface QuestionDetailOption {
  id: string;
  label: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionDetailImage {
  id: string;
  role: "question" | "option" | "answer";
  label: string | null;
  imagePath: string;
}

export interface QuestionDetailValues {
  questionText: string;
  answerText: string;
  language: "en" | "si";
  category: string | null;
  correctOptionLabel: string | null;
  explanationVideoUrl: string | null;
  options: QuestionDetailOption[];
  images: QuestionDetailImage[];
}

export function QuestionDetail({
  questionText,
  answerText,
  language,
  category,
  correctOptionLabel,
  explanationVideoUrl,
  options,
  images,
}: QuestionDetailValues) {
  const { t } = useTranslation();
  const textClass = cn(language === "si" && "font-sinhala");
  const questionImages = images.filter((img) => img.role === "question");
  const optionImages = images.filter((img) => img.role === "option");
  const answerImages = images.filter((img) => img.role === "answer");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {category && <Badge variant="outline">{category}</Badge>}
        <Badge variant="outline">{language === "si" ? "සිංහල" : "EN"}</Badge>
      </div>

      <p className={cn("text-base font-medium", textClass)}>{questionText}</p>

      {questionImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {questionImages.map((img) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={img.id}
              src={`/api/uploads/questions/${img.imagePath}`}
              alt="Question figure"
              className="aspect-square w-full rounded-md border border-border bg-muted object-contain"
            />
          ))}
        </div>
      )}

      {options.length > 0 ? (
        <div className="space-y-2">
          {options.map((o) => (
            <div
              key={o.id}
              className={cn(
                "flex items-center gap-2 rounded-md border p-2.5 text-sm",
                o.isCorrect ? "border-success bg-success/10" : "border-border"
              )}
            >
              <span className="w-5 shrink-0 font-bold">{o.label}</span>
              <span className={textClass}>{o.text}</span>
              {o.isCorrect && (
                <span className="ml-auto text-xs font-semibold text-success">{t("questions.correct")}</span>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3 rounded-md border border-dashed border-border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("questions.answerHeading")}</p>
          <Markdown className={textClass}>{answerText}</Markdown>
          {correctOptionLabel && (
            <p className="text-xs text-muted-foreground">
              {t("questions.correctOptionText", { label: correctOptionLabel })}
            </p>
          )}
          {answerImages.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {answerImages.map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={img.id}
                  src={`/api/uploads/questions/${img.imagePath}`}
                  alt="Solution figure"
                  className="aspect-square w-full rounded-md border border-border bg-muted object-contain"
                />
              ))}
            </div>
          )}
          {explanationVideoUrl && <VideoEmbed url={explanationVideoUrl} />}
        </div>
      )}

      {optionImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {optionImages.map((img) => (
            <div key={img.id} className="overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/uploads/questions/${img.imagePath}`}
                alt={`Option ${img.label ?? ""}`}
                className="aspect-square w-full bg-muted object-contain"
              />
              <p className="p-1.5 text-center text-xs font-medium">
                {t("questions.optionImageCaption", { label: img.label ?? "" })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
