"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface ChapterFormValues {
  id: string;
  title: string;
  subtitle: string;
  coverImageUrl: string;
  isFreePreview: boolean;
}

export function ChapterForm({ bookId, initial }: { bookId: string; initial: ChapterFormValues }) {
  const router = useRouter();

  const [title, setTitle] = useState(initial.title);
  const [subtitle, setSubtitle] = useState(initial.subtitle);
  const [coverImageUrl, setCoverImageUrl] = useState(initial.coverImageUrl);
  const [isFreePreview, setIsFreePreview] = useState(initial.isFreePreview);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/books/${bookId}/chapters/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        subtitle: subtitle || null,
        coverImageUrl: coverImageUrl.trim() || null,
        isFreePreview,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="subtitle">Subtitle</Label>
        <Textarea
          id="subtitle"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g. Professional rejections, declining meetings, and setting workload boundaries."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="coverImageUrl">Cover image URL</Label>
        <div className="flex items-start gap-3">
          <Input
            id="coverImageUrl"
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            placeholder="https://i.ibb.co/…"
            className="flex-1"
          />
          {coverImageUrl.trim() && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl.trim()}
              alt=""
              className="h-14 w-20 shrink-0 rounded-md border border-border object-cover"
              onError={(e) => (e.currentTarget.style.visibility = "hidden")}
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isFreePreview"
          type="checkbox"
          checked={isFreePreview}
          onChange={(e) => setIsFreePreview(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isFreePreview">Free preview (readable in the store before purchase)</Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
