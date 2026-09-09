"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WordForm, type WordFormBookOption } from "@/components/vocab/WordForm";

export interface VocabContentItem {
  id: string;
  term: string;
  definition: string | null;
  definitionSi: string | null;
  exampleSentence: string | null;
  bookId: string | null;
  bookTitle: string | null;
  chapter: string | null;
}

export function VocabContentAccordion({
  items,
  books,
}: {
  items: VocabContentItem[];
  books: WordFormBookOption[];
}) {
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
        const subtitle = [item.bookTitle, item.chapter && `Ch. ${item.chapter}`].filter(Boolean).join(" · ");
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
                <p className="truncate font-medium">{item.term}</p>
                {(item.definition || subtitle) && (
                  <p className="truncate text-xs text-muted-foreground">
                    {item.definition}
                    {item.definition && subtitle && " — "}
                    {subtitle}
                  </p>
                )}
                {item.definitionSi && (
                  <p className="truncate font-sinhala text-xs text-muted-foreground">{item.definitionSi}</p>
                )}
              </div>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
              <div className="border-t border-border bg-muted/20 p-4">
                <WordForm
                  books={books}
                  initial={{
                    id: item.id,
                    term: item.term,
                    definition: item.definition ?? "",
                    definitionSi: item.definitionSi ?? "",
                    exampleSentence: item.exampleSentence ?? "",
                    bookId: item.bookId ?? "",
                    chapter: item.chapter ?? "",
                  }}
                  onSaved={handleSaved}
                  onDeleted={() => handleDeleted(item.id)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
