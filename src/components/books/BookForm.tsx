"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export interface BookFormValues {
  id?: string;
  title: string;
  author: string;
  description: string;
  coverImageUrl: string;
  price: string;
  isPublished: boolean;
  quizBankId: string;
  previewPhraseLimit: string;
  speechEnabled: boolean;
}

export interface QuizBankOption {
  id: string;
  title: string;
}

export function BookForm({
  initial,
  quizBanks = [],
}: {
  initial?: BookFormValues;
  quizBanks?: QuizBankOption[];
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [author, setAuthor] = useState(initial?.author ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [speechEnabled, setSpeechEnabled] = useState(initial?.speechEnabled ?? true);
  const [quizBankId, setQuizBankId] = useState(initial?.quizBankId ?? "");
  const [previewPhraseLimit, setPreviewPhraseLimit] = useState(initial?.previewPhraseLimit ?? "5");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isEdit ? `/api/books/${initial!.id}` : "/api/books";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        author: author || undefined,
        description: description || undefined,
        coverImageUrl: coverImageUrl.trim() || null,
        price: price ? Number(price) : undefined,
        isPublished,
        speechEnabled,
        quizBankId: quizBankId || null,
        previewPhraseLimit: previewPhraseLimit ? Number(previewPhraseLimit) : 5,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    const data = await res.json();
    const bookId = isEdit ? initial!.id : data.book.id;
    router.push(`/manage/books/${bookId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Say This, Not That: The Workplace Edition"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="author">Author</Label>
        <Input id="author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Optional" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's in this book, shown to buyers"
        />
        <p className="text-xs text-muted-foreground">Supports Markdown.</p>
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
      <div className="space-y-1.5">
        <Label htmlFor="price">Price (LKR)</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 1500"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="previewPhraseLimit">Free preview phrase limit</Label>
        <Input
          id="previewPhraseLimit"
          type="number"
          min="0"
          step="1"
          value={previewPhraseLimit}
          onChange={(e) => setPreviewPhraseLimit(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          How many phrases to show per free-preview chapter on the public store page before requiring purchase.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="quizBankId">Quiz bank (optional)</Label>
        <Select id="quizBankId" value={quizBankId} onChange={(e) => setQuizBankId(e.target.value)}>
          <option value="">No quiz</option>
          {quizBanks.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Link an existing exam question bank to give this book a "Take the quiz" button — reuses that bank's
          Practice/Exam modes as-is.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isPublished"
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isPublished">Published (visible in the store)</Label>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2">
          <input
            id="speechEnabled"
            type="checkbox"
            checked={speechEnabled}
            onChange={(e) => setSpeechEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="speechEnabled">Read-aloud speaker icon (English phrases)</Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Lets readers tap a speaker icon to hear each English phrase spoken aloud, using their browser's built-in
          voice. Applies to every chapter in this book.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Save changes" : "Create book"}
        </Button>
      </div>
    </form>
  );
}
