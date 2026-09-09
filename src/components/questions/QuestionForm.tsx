"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/useTranslation";

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
  onSaved,
  onDeleted,
}: {
  initial?: QuestionFormValues;
  bankId?: string;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
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
      setError(t("questions.fillAllOptions"));
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
      setError(data.error ?? t("common.error"));
      return;
    }

    if (onSaved) {
      onSaved();
      return;
    }
    // Land on the edit page after creating, not the list - image upload
    // needs a question id, so this is the first point it's possible.
    router.push(isEdit ? "/questions" : `/questions/${data.question.id}`);
    router.refresh();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm(t("questions.deleteConfirm"))) return;

    setDeleting(true);
    const res = await fetch(`/api/questions/${initial.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      setError(t("questions.deleteFailed"));
      return;
    }

    if (onDeleted) {
      onDeleted();
      return;
    }
    router.push("/questions");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="language">{t("questions.languageLabel")}</Label>
        <Select
          id="language"
          value={language}
          onChange={(e) => setLanguage(e.target.value as "en" | "si")}
        >
          <option value="en">{t("questions.englishOption")}</option>
          <option value="si">{t("questions.sinhalaOption")}</option>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="questionText">{t("questions.questionLabel")}</Label>
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
        <Label htmlFor="answerText">{t("questions.answerLabel")}</Label>
        <Textarea
          id="answerText"
          required
          rows={6}
          className={textClass}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">{t("questions.markdownHint")}</p>
        {mcqEnabled && <p className="text-xs text-muted-foreground">{t("questions.mcqHiddenHint")}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="explanationVideoUrl">{t("questions.explanationVideoLabel")}</Label>
        <Input
          id="explanationVideoUrl"
          type="url"
          value={explanationVideoUrl}
          onChange={(e) => setExplanationVideoUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
        />
        <p className="text-xs text-muted-foreground">{t("questions.videoHint")}</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="category">{t("questions.categoryLabel")}</Label>
        <Input
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={t("questions.categoryPlaceholder")}
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
          <Label htmlFor="mcqEnabled">{t("questions.mcqToggleLabel")}</Label>
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
                  aria-label={t("questions.optionIsCorrectAria", { label })}
                  className="h-4 w-4 shrink-0"
                />
                <span className="w-5 shrink-0 text-sm font-bold">{label}</span>
                <Input
                  value={optionTexts[label]}
                  onChange={(e) => setOptionTexts((prev) => ({ ...prev, [label]: e.target.value }))}
                  placeholder={t("questions.optionPlaceholder", { label })}
                  className={textClass}
                />
              </div>
            ))}
            <p className="text-xs text-muted-foreground">{t("questions.mcqHint")}</p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="correctOptionLabel">{t("questions.correctOptionLabel")}</Label>
        <Input
          id="correctOptionLabel"
          value={correctOptionLabel}
          onChange={(e) => setCorrectOptionLabel(e.target.value)}
          placeholder={t("questions.correctOptionPlaceholder")}
          maxLength={5}
        />
        <p className="text-xs text-muted-foreground">{t("questions.correctOptionHint")}</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : isEdit ? t("questions.saveChanges") : t("questions.addQuestionBtn")}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? t("questions.deleting") : t("common.delete")}
          </Button>
        )}
      </div>
    </form>
  );
}
