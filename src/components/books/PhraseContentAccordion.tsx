"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface PhraseContentItem {
  id: string;
  phrase: string;
  translationSi: string | null;
  pronunciationSi: string | null;
  explanation: string;
  explanationSi: string | null;
  isReviewed: boolean;
  reviewedAt: string | null;
  reviewedByName: string | null;
}

interface PhraseApiResponse {
  id: string;
  phrase: string;
  translationSi: string | null;
  pronunciationSi: string | null;
  explanation: string;
  explanationSi: string | null;
  isReviewed: boolean;
  reviewedAt: string | null;
  reviewedBy: { displayName: string | null; email: string } | null;
}

function mapPhraseToItem(p: PhraseApiResponse): PhraseContentItem {
  return {
    id: p.id,
    phrase: p.phrase,
    translationSi: p.translationSi,
    pronunciationSi: p.pronunciationSi,
    explanation: p.explanation,
    explanationSi: p.explanationSi,
    isReviewed: p.isReviewed,
    reviewedAt: p.reviewedAt,
    reviewedByName: p.reviewedBy ? p.reviewedBy.displayName ?? p.reviewedBy.email : null,
  };
}

export function PhraseContentAccordion({
  bookId,
  chapterId,
  items,
}: {
  bookId: string;
  chapterId: string;
  items: PhraseContentItem[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function handleDeleted(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setExpandedId(null);
    router.refresh();
  }

  function handleUpdated(id: string, patch: PhraseContentItem) {
    setRows((prev) => prev.map((r) => (r.id === id ? patch : r)));
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No phrases in this chapter yet.</p>;
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
              <span
                className={cn(
                  "h-2.5 w-2.5 shrink-0 rounded-full",
                  item.isReviewed ? "bg-success" : "bg-destructive"
                )}
                title={item.isReviewed ? "Reviewed — visible to customers" : "Not reviewed — hidden from customers"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.phrase}</p>
                {item.translationSi && <p className="truncate font-sinhala text-xs text-muted-foreground">{item.translationSi}</p>}
              </div>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
              <div className="border-t border-border bg-muted/20 p-4">
                <PhraseInlineForm
                  bookId={bookId}
                  chapterId={chapterId}
                  item={item}
                  onSaved={() => {
                    setExpandedId(null);
                    router.refresh();
                  }}
                  onUpdated={(patch) => handleUpdated(item.id, patch)}
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

function PhraseInlineForm({
  bookId,
  chapterId,
  item,
  onSaved,
  onUpdated,
  onDeleted,
}: {
  bookId: string;
  chapterId: string;
  item: PhraseContentItem;
  onSaved: () => void;
  onUpdated: (patch: PhraseContentItem) => void;
  onDeleted: () => void;
}) {
  const [phrase, setPhrase] = useState(item.phrase);
  const [translationSi, setTranslationSi] = useState(item.translationSi ?? "");
  const [pronunciationSi, setPronunciationSi] = useState(item.pronunciationSi ?? "");
  const [explanation, setExplanation] = useState(item.explanation);
  const [explanationSi, setExplanationSi] = useState(item.explanationSi ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/books/${bookId}/chapters/${chapterId}/phrases/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phrase,
        translationSi: translationSi || null,
        pronunciationSi: pronunciationSi || null,
        explanation,
        explanationSi: explanationSi || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    const data = await res.json();
    onUpdated(mapPhraseToItem(data.phrase));
    onSaved();
  }

  async function handleMarkReviewed(markReviewed: boolean) {
    setReviewError(null);
    setReviewLoading(true);

    const res = await fetch(`/api/books/${bookId}/chapters/${chapterId}/phrases/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markReviewed }),
    });

    setReviewLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setReviewError(data.error ?? "Something went wrong");
      return;
    }

    const data = await res.json();
    onUpdated(mapPhraseToItem(data.phrase));
  }

  async function handleDelete() {
    if (!confirm("Delete this phrase? This can't be undone.")) return;
    setDeleting(true);
    const res = await fetch(`/api/books/${bookId}/chapters/${chapterId}/phrases/${item.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onDeleted();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn("h-2.5 w-2.5 shrink-0 rounded-full", item.isReviewed ? "bg-success" : "bg-destructive")}
          />
          {item.isReviewed ? (
            <span>
              Reviewed{item.reviewedByName ? ` by ${item.reviewedByName}` : ""}
              {item.reviewedAt ? ` on ${new Date(item.reviewedAt).toLocaleString()}` : ""}
            </span>
          ) : (
            <span className="text-muted-foreground">Not reviewed — hidden from customers</span>
          )}
        </div>
        <Button
          type="button"
          variant={item.isReviewed ? "outline" : "default"}
          size="sm"
          disabled={reviewLoading}
          onClick={() => handleMarkReviewed(!item.isReviewed)}
        >
          {reviewLoading ? "Saving…" : item.isReviewed ? "Unmark reviewed" : "Mark as reviewed"}
        </Button>
      </div>
      {reviewError && <p className="text-sm text-destructive">{reviewError}</p>}

      <div className="space-y-1.5">
        <Label htmlFor={`phrase-${item.id}`}>Phrase</Label>
        <Input id={`phrase-${item.id}`} required value={phrase} onChange={(e) => setPhrase(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`translationSi-${item.id}`}>Sinhala translation</Label>
        <Input
          id={`translationSi-${item.id}`}
          className="font-sinhala"
          value={translationSi}
          onChange={(e) => setTranslationSi(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`pronunciationSi-${item.id}`}>Pronunciation (Sinhala letters)</Label>
        <Input
          id={`pronunciationSi-${item.id}`}
          className="font-sinhala"
          value={pronunciationSi}
          onChange={(e) => setPronunciationSi(e.target.value)}
          placeholder="The English phrase spelled out phonetically in Sinhala letters"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`explanation-${item.id}`}>Explanation</Label>
        <Textarea
          id={`explanation-${item.id}`}
          required
          rows={5}
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Supports Markdown.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`explanationSi-${item.id}`}>Explanation (Sinhala)</Label>
        <Textarea
          id={`explanationSi-${item.id}`}
          className="font-sinhala"
          rows={5}
          value={explanationSi}
          onChange={(e) => setExplanationSi(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">Supports Markdown.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {item.isReviewed && (
        <p className="text-xs text-muted-foreground">Saving content changes will mark this phrase as not reviewed.</p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : "Save changes"}
        </Button>
        <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </form>
  );
}
