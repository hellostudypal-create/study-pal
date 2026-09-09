"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export interface ChapterListItem {
  id: string;
  title: string;
  order: number;
  isFreePreview: boolean;
  phraseCount: number;
}

export function ChapterList({ bookId, chapters }: { bookId: string; chapters: ChapterListItem[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(chapters);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    setError(null);
    const res = await fetch(`/api/books/${bookId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setAdding(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to add chapter");
      return;
    }
    const data = await res.json();
    setRows((prev) => [...prev, { id: data.chapter.id, title: data.chapter.title, order: data.chapter.order, isFreePreview: false, phraseCount: 0 }]);
    setNewTitle("");
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this chapter and all its phrases? This can't be undone.")) return;
    const res = await fetch(`/api/books/${bookId}/chapters/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRows((prev) => prev.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= rows.length) return;
    const a = rows[index];
    const b = rows[target];
    await Promise.all([
      fetch(`/api/books/${bookId}/chapters/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: b.order }),
      }),
      fetch(`/api/books/${bookId}/chapters/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: a.order }),
      }),
    ]);
    const next = [...rows];
    [next[index], next[target]] = [
      { ...next[target], order: a.order },
      { ...next[index], order: b.order },
    ];
    setRows(next);
    router.refresh();
  }

  const sorted = [...rows].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-4">
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No chapters yet — add one below.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {sorted.map((chapter, index) => (
            <li key={chapter.id} className="flex items-center justify-between gap-3 p-3 text-sm">
              <Link href={`/manage/books/${bookId}/chapters/${chapter.id}`} className="min-w-0 flex-1 hover:underline">
                <span className="font-medium">{chapter.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {chapter.phraseCount} {chapter.phraseCount === 1 ? "phrase" : "phrases"}
                </span>
                {chapter.isFreePreview && (
                  <Badge variant="outline" className="ml-2 text-[10px]">
                    Free preview
                  </Badge>
                )}
              </Link>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={index === sorted.length - 1}
                  className="rounded p-1 text-muted-foreground hover:bg-muted disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(chapter.id)}
                  className="ml-2 text-xs text-destructive hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New chapter title"
          className="flex-1"
        />
        <Button type="submit" disabled={adding || !newTitle.trim()}>
          {adding ? "Adding…" : "+ Add chapter"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
