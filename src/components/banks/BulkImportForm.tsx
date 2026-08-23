"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  parseExamQuestionBlocks,
  parseVocabWordBlocks,
  type ParsedExamQuestion,
  type ParsedVocabWord,
} from "@/lib/bulk-import";

const EXAM_PLACEHOLDER = `Category: Bank Interview 2026
Language: en
This ship has a widening crack in its hull.
The word closest in meaning to "widening" is:
Answer: growing larger
---
`;

const VOCAB_PLACEHOLDER = `Term: ephemeral
Definition: lasting for a very short time
Example: The beauty of cherry blossoms is ephemeral.
Source: Alice in Wonderland
---
`;

export function BulkImportForm({ bankId, kind }: { bankId: string; kind: "exam" | "vocab" }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const { items, errors } = useMemo(() => {
    if (!text.trim()) return { items: [], errors: [] };
    return kind === "exam" ? parseExamQuestionBlocks(text) : parseVocabWordBlocks(text);
  }, [text, kind]);

  async function handleImport() {
    if (items.length === 0) return;
    setError(null);
    setSuccessCount(null);
    setSubmitting(true);

    const res = await fetch(kind === "exam" ? "/api/questions/bulk" : "/api/vocab/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankId, items }),
    });

    setSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Import failed");
      return;
    }

    const data = await res.json();
    setSuccessCount(data.created);
    setText("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={kind === "exam" ? EXAM_PLACEHOLDER : VOCAB_PLACEHOLDER}
        rows={14}
        className="font-mono text-sm"
      />

      {successCount !== null && (
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          Imported {successCount} item{successCount === 1 ? "" : "s"}.
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {(items.length > 0 || errors.length > 0) && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="default">{items.length} ready</Badge>
            {errors.length > 0 && <Badge variant="destructive">{errors.length} error{errors.length === 1 ? "" : "s"}</Badge>}
          </div>

          {errors.length > 0 && (
            <ul className="space-y-1 rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm">
              {errors.map((e, i) => (
                <li key={i} className="text-destructive">
                  Block {e.blockIndex + 1}: {e.message}
                </li>
              ))}
            </ul>
          )}

          {items.length > 0 && (
            <div className="max-h-80 overflow-y-auto rounded-md border border-border">
              <ul className="divide-y divide-border">
                {kind === "exam"
                  ? (items as ParsedExamQuestion[]).map((item, i) => (
                      <li key={i} className="space-y-1 p-3 text-sm">
                        <p className="font-medium">{item.questionText}</p>
                        <p className="text-muted-foreground">Answer: {item.answerText}</p>
                        {item.category && (
                          <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                        )}
                      </li>
                    ))
                  : (items as ParsedVocabWord[]).map((item, i) => (
                      <li key={i} className="space-y-1 p-3 text-sm">
                        <p className="font-medium">{item.term}</p>
                        {item.definition && <p className="text-muted-foreground">{item.definition}</p>}
                      </li>
                    ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Button onClick={handleImport} disabled={items.length === 0 || submitting}>
        {submitting ? "Importing…" : `Import ${items.length || ""} item${items.length === 1 ? "" : "s"}`}
      </Button>
    </div>
  );
}
