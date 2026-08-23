"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface WordFormValues {
  id?: string;
  term: string;
  definition: string;
  exampleSentence: string;
  sourceBook: string;
}

export function WordForm({ initial }: { initial?: WordFormValues }) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [term, setTerm] = useState(initial?.term ?? "");
  const [definition, setDefinition] = useState(initial?.definition ?? "");
  const [exampleSentence, setExampleSentence] = useState(initial?.exampleSentence ?? "");
  const [sourceBook, setSourceBook] = useState(initial?.sourceBook ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isEdit ? `/api/vocab/${initial!.id}` : "/api/vocab";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        term,
        definition: definition || undefined,
        exampleSentence: exampleSentence || undefined,
        sourceBook: sourceBook || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.push("/vocab");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm(`Delete "${initial.term}"? This can't be undone.`)) return;

    setDeleting(true);
    const res = await fetch(`/api/vocab/${initial.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      setError("Failed to delete");
      return;
    }

    router.push("/vocab");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="term">Word or phrase</Label>
        <Input
          id="term"
          required
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="e.g. ephemeral"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="definition">Definition</Label>
        <Textarea
          id="definition"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder="What does it mean?"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="exampleSentence">Example sentence</Label>
        <Textarea
          id="exampleSentence"
          value={exampleSentence}
          onChange={(e) => setExampleSentence(e.target.value)}
          placeholder="The sentence you found it in"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="sourceBook">Source book</Label>
        <Input
          id="sourceBook"
          value={sourceBook}
          onChange={(e) => setSourceBook(e.target.value)}
          placeholder="Which book was this from?"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Save changes" : "Add word"}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
      </div>
    </form>
  );
}
