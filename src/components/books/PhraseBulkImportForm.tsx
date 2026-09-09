"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseBookPhraseBlocks } from "@/lib/bulk-import";

const PLACEHOLDER = `Phrase: I want to flag a concern before we move forward.
TranslationSi: ඉදිරියට යාමට පෙර මට කනස්සල්ලක් පෙන්වා දීමට අවශ්‍යයි.
PronunciationSi: අයි වොන්ට් ටු ෆ්ලැග් අ කන්සර්න් බිෆෝර් වී මූව් ෆෝවඩ්.
Explanation: A calm, direct way to raise an objection in a meeting without sounding confrontational. Use it right before the decision is finalized, not after.
ExplanationSi: රැස්වීමක දී විරෝධතාවයක් හෙළි කිරීමට සන්සුන්, සෘජු ක්‍රමයක්. තීරණය අවසන් වීමට පෙර මෙය භාවිතා කරන්න.
---
`;

export function PhraseBulkImportForm({ bookId, chapterId }: { bookId: string; chapterId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const { items, errors } = useMemo(() => {
    if (!text.trim()) return { items: [], errors: [] };
    return parseBookPhraseBlocks(text);
  }, [text]);

  async function handleImport() {
    if (items.length === 0) return;
    setError(null);
    setSuccessCount(null);
    setSubmitting(true);

    const res = await fetch(`/api/books/${bookId}/chapters/${chapterId}/phrases/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
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
        placeholder={PLACEHOLDER}
        rows={12}
        className="font-mono text-sm"
      />

      {successCount !== null && (
        <p className="text-sm font-medium text-green-700 dark:text-green-400">
          Imported {successCount} phrase{successCount === 1 ? "" : "s"}.
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
                {items.map((item, i) => (
                  <li key={i} className="space-y-1 p-3 text-sm">
                    <p className="font-medium">{item.phrase}</p>
                    {item.pronunciationSi && <p className="font-sinhala text-xs italic text-muted-foreground">{item.pronunciationSi}</p>}
                    {item.translationSi && <p className="font-sinhala text-muted-foreground">{item.translationSi}</p>}
                    <p className="line-clamp-2 text-xs text-muted-foreground">{item.explanation}</p>
                    {item.explanationSi && <p className="line-clamp-2 font-sinhala text-xs text-muted-foreground">{item.explanationSi}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <Button onClick={handleImport} disabled={items.length === 0 || submitting}>
        {submitting ? "Importing…" : `Import ${items.length || ""} phrase${items.length === 1 ? "" : "s"}`}
      </Button>
    </div>
  );
}
