"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

export interface QuestionFormValues {
  id?: string;
  questionText: string;
  answerText: string;
  language: "en" | "si";
  category: string;
  correctOptionLabel: string;
}

export function QuestionForm({ initial }: { initial?: QuestionFormValues }) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [questionText, setQuestionText] = useState(initial?.questionText ?? "");
  const [answerText, setAnswerText] = useState(initial?.answerText ?? "");
  const [language, setLanguage] = useState<"en" | "si">(initial?.language ?? "en");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [correctOptionLabel, setCorrectOptionLabel] = useState(
    initial?.correctOptionLabel ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const textClass = cn(language === "si" && "font-sinhala");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const url = isEdit ? `/api/questions/${initial!.id}` : "/api/questions";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText,
        answerText,
        language,
        category: category || undefined,
        correctOptionLabel: correctOptionLabel || undefined,
      }),
    });

    setLoading(false);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      return;
    }

    // Land on the edit page after creating, not the list - image upload
    // needs a question id, so this is the first point it's possible.
    router.push(isEdit ? "/questions" : `/questions/${data.question.id}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm("Delete this question? This can't be undone.")) return;

    setDeleting(true);
    const res = await fetch(`/api/questions/${initial.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      setError("Failed to delete");
      return;
    }

    router.push("/questions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="language">Language</Label>
        <Select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as "en" | "si")}
        >
          <option value="en">English</option>
          <option value="si">සිංහල (Sinhala)</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="questionText">Question</Label>
        <Textarea
          id="questionText"
          required
          autoFocus
          className={textClass}
          value={questionText}
          onChange={(e) => setQuestionText(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="answerText">Answer</Label>
        <Textarea
          id="answerText"
          required
          className={textClass}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. Bank Interview 2026, Physics Grade 10"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="correctOptionLabel">Correct option (if this uses image answer options)</Label>
        <Input
          id="correctOptionLabel"
          value={correctOptionLabel}
          onChange={(e) => setCorrectOptionLabel(e.target.value)}
          placeholder="e.g. A, B, C"
          maxLength={5}
        />
        <p className="text-xs text-muted-foreground">
          Leave blank for plain text questions. Fill in once you&apos;ve added labeled answer-option images below.
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving…" : isEdit ? "Save changes" : "Add question"}
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
