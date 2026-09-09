"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuestionForm } from "@/components/questions/QuestionForm";
import { QuestionImages, type QuestionImageItem } from "@/components/questions/QuestionImages";

export interface QuestionContentItem {
  id: string;
  questionText: string;
  answerText: string;
  language: "en" | "si";
  category: string | null;
  correctOptionLabel: string | null;
  explanationVideoUrl: string | null;
  options: { label: string; text: string; isCorrect: boolean }[];
  images: QuestionImageItem[];
}

export function QuestionContentAccordion({ items }: { items: QuestionContentItem[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleSaved() {
    setExpandedId(null);
    router.refresh();
  }

  function handleDeleted(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setExpandedId(null);
    router.refresh();
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No content in this bank yet.</p>;
  }

  return (
    <div className="divide-y divide-border rounded-md border border-border">
      {rows.map((item) => {
        const expanded = expandedId === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              onClick={() => setExpandedId(expanded ? null : item.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 p-3 text-left text-sm transition-colors",
                expanded ? "bg-primary-tint" : "hover:bg-muted/40"
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.questionText}</p>
                {item.category && <p className="truncate text-xs text-muted-foreground">{item.category}</p>}
              </div>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
              <div className="space-y-6 border-t border-border bg-muted/20 p-4">
                <QuestionForm
                  initial={{
                    id: item.id,
                    questionText: item.questionText,
                    answerText: item.answerText,
                    language: item.language,
                    category: item.category ?? "",
                    correctOptionLabel: item.correctOptionLabel ?? "",
                    explanationVideoUrl: item.explanationVideoUrl ?? "",
                    options: item.options,
                  }}
                  onSaved={handleSaved}
                  onDeleted={() => handleDeleted(item.id)}
                />
                <div className="space-y-1.5 border-t border-dashed border-border pt-4">
                  <p className="text-sm font-semibold">Images</p>
                  <QuestionImages questionId={item.id} initialImages={item.images} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
