"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";

const OPTION_LABELS = ["A", "B", "C", "D"] as const;
type OptionLabel = (typeof OPTION_LABELS)[number];

export interface QuestionFormValues {
  id?: string;
  questionText: string;
  answerText: string;
  language: "en" | "si";
  category: string;
  correctOptionLabel: string;
  explanationVideoUrl: string;
  options?: { label: string; text: string; isCorrect: boolean }[];
}

export function QuestionForm({
  initial,
  bankId,
}: {
  initial?: QuestionFormValues;
  bankId?: string;
}) {
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [questionText, setQuestionText] = useState(initial?.questionText ?? "");
  const [answerText, setAnswerText] = useState(initial?.answerText ?? "");
  const [language, setLanguage] = useState<"en" | "si">(initial?.language ?? "en");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [correctOptionLabel, setCorrectOptionLabel] = useState(
    initial?.correctOptionLabel ?? ""
  );
  const [explanationVideoUrl, setExplanationVideoUrl] = useState(
    initial?.explanationVideoUrl ?? ""
  );

  const initialMcq = (initial?.options?.length ?? 0) === 4;
  const [mcqEnabled, setMcqEnabled] = useState(initialMcq);
  const [optionTexts, setOptionTexts] = useState<Record<OptionLabel, string>>(() => {
    const base: Record<OptionLabel, string> = { A: "", B: "", C: "", D: "" };
    for (const o of initial?.options ?? []) {
      if (OPTION_LABELS.includes(o.label as OptionLabel)) base[o.label as OptionLabel] = o.text;
    }
    return base;
  });
  const [correctLabel, setCorrectLabel] = useState<OptionLabel>(
    (initial?.options?.find((o) => o.isCorrect)?.label as OptionLabel) ?? "A"
  );

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const textClass = cn(language === "si" && "font-sinhala");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mcqEnabled && OPTION_LABELS.some((l) => !optionTexts[l].trim())) {
      setError("Fill in all four options, or turn off multiple-choice.");
      return;
    }

    setLoading(true);

    const url = isEdit ? `/api/questions/${initial!.id}` : "/api/questions";
    const method = isEdit ? "PATCH" : "POST";

    const options = mcqEnabled
      ? OPTION_LABELS.map((label) => ({
          label,
          text: optionTexts[label].trim(),
          isCorrect: label === correctLabel,
        }))
      : isEdit
        ? null
        : undefined;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText,
        answerText,
        language,
        category: category || undefined,
        correctOptionLabel: correctOptionLabel || undefined,
        explanationVideoUrl: explanationVideoUrl.trim() || undefined,
        options,
        ...(isEdit ? {} : { bankId }),
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
        <Label htmlFor="answerText">Answer / solution</Label>
        <Textarea
          id="answerText"
          required
          rows={6}
          className={textClass}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Supports Markdown — **bold**, *italic*, lists, [links](https://…), and ![images](https://…). Add
          uploaded images below, and an explanation video underneath.
        </p>
        {mcqEnabled && (
          <p className="text-xs text-muted-foreground">
            Not shown to quiz-takers while multiple-choice options are on below — kept as a fallback summary.
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="explanationVideoUrl">Explanation video (optional)</Label>
        <Input
          id="explanationVideoUrl"
          type="url"
          value={explanationVideoUrl}
          onChange={(e) => setExplanationVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
        />
        <p className="text-xs text-muted-foreground">
          A YouTube link embeds a player in the solution; any other link shows a direct video or a "Watch" button.
        </p>
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

      <div className="space-y-3 rounded-md border border-dashed border-border p-4">
        <div className="flex items-center gap-2">
          <input
            id="mcqEnabled"
            type="checkbox"
            checked={mcqEnabled}
            onChange={(e) => setMcqEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          <Label htmlFor="mcqEnabled">Multiple-choice (4 text options)</Label>
        </div>
        {mcqEnabled && (
          <div className="space-y-2.5">
            {OPTION_LABELS.map((label) => (
              <div key={label} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correctLabel"
                  checked={correctLabel === label}
                  onChange={() => setCorrectLabel(label)}
                  aria-label={`Option ${label} is correct`}
                  className="h-4 w-4 shrink-0"
                />
                <span className="w-5 shrink-0 text-sm font-bold">{label}</span>
                <Input
                  value={optionTexts[label]}
                  onChange={(e) => setOptionTexts((prev) => ({ ...prev, [label]: e.target.value }))}
                  placeholder={`Option ${label} text`}
                  className={textClass}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Select the radio button next to the correct option.</p>
          </div>
        )}
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
          For the separate image-based answer options below (not the text options above) — leave blank otherwise.
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
