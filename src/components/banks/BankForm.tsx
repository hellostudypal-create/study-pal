"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const EXAM_CATEGORIES = ["IQ", "Grade5Scholarship", "OL", "AL", "GovAdmin", "Other"] as const;

export interface BankFormValues {
  id?: string;
  kind: "exam" | "vocab";
  title: string;
  description: string;
  examCategory: string;
  standardExamQuestionCount: string;
  examTimeLimitMinutes: string;
  theme: string;
  price: string;
  isPublished: boolean;
}

export function BankForm({ initial }: { initial?: BankFormValues }) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [kind, setKind] = useState<"exam" | "vocab">(initial?.kind ?? "exam");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [examCategory, setExamCategory] = useState(initial?.examCategory ?? "IQ");
  const [standardExamQuestionCount, setStandardExamQuestionCount] = useState(
    initial?.standardExamQuestionCount ?? ""
  );
  const [examTimeLimitMinutes, setExamTimeLimitMinutes] = useState(initial?.examTimeLimitMinutes ?? "");
  const [theme, setTheme] = useState(initial?.theme ?? "");
  const [price, setPrice] = useState(initial?.price ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isEdit ? `/api/banks/${initial!.id}` : "/api/banks";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(isEdit ? {} : { kind }),
        title,
        description: description || undefined,
        examCategory: kind === "exam" ? examCategory : undefined,
        standardExamQuestionCount:
          kind === "exam" && standardExamQuestionCount ? Number(standardExamQuestionCount) : null,
        examTimeLimitMinutes: kind === "exam" && examTimeLimitMinutes ? Number(examTimeLimitMinutes) : null,
        theme: kind === "vocab" ? theme || undefined : undefined,
        price: price ? Number(price) : undefined,
        isPublished,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    const data = await res.json();
    const bankId = isEdit ? initial!.id : data.bank.id;
    router.push(`/manage/banks/${bankId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && (
        <div className="space-y-1.5">
          <Label htmlFor="kind">Type</Label>
          <Select id="kind" value={kind} onChange={(e) => setKind(e.target.value as "exam" | "vocab")}>
            <option value="exam">Exam questions</option>
            <option value="vocab">Vocabulary</option>
          </Select>
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Grade 5 Scholarship — Maths 2026"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's in this bank, shown to buyers"
        />
      </div>
      {kind === "exam" ? (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="examCategory">Category</Label>
            <Select id="examCategory" value={examCategory} onChange={(e) => setExamCategory(e.target.value)}>
              {EXAM_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="standardExamQuestionCount">Questions per exam</Label>
              <Input
                id="standardExamQuestionCount"
                type="number"
                min="1"
                step="1"
                value={standardExamQuestionCount}
                onChange={(e) => setStandardExamQuestionCount(e.target.value)}
                placeholder="e.g. 50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="examTimeLimitMinutes">Time limit (minutes)</Label>
              <Input
                id="examTimeLimitMinutes"
                type="number"
                min="1"
                step="1"
                value={examTimeLimitMinutes}
                onChange={(e) => setExamTimeLimitMinutes(e.target.value)}
                placeholder="e.g. 60"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Set both to split this bank into standard, non-overlapping timed exams (Set 1, Set 2, …) in Exam mode.
            Leave blank to only offer untimed Practice mode.
          </p>
        </>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="theme">Theme / source</Label>
          <Input
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            placeholder="e.g. Alice in Wonderland"
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="price">Price (LKR)</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="e.g. 750"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isPublished"
          type="checkbox"
          checked={isPublished}
          onChange={(e) => setIsPublished(e.target.checked)}
          className="h-4 w-4 rounded border-input"
        />
        <Label htmlFor="isPublished">Published (visible to buyers)</Label>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Save changes" : "Create bank"}
        </Button>
      </div>
    </form>
  );
}
