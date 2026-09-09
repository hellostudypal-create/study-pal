"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface WordFormValues {
  id?: string;
  term: string;
  definition: string;
  definitionSi: string;
  exampleSentence: string;
  bookId: string;
  chapter: string;
}

export interface WordFormBookOption {
  id: string;
  title: string;
}

export function WordForm({
  initial,
  books = [],
  bankId,
  onSaved,
  onDeleted,
}: {
  initial?: WordFormValues;
  books?: WordFormBookOption[];
  bankId?: string;
  onSaved?: () => void;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const isEdit = !!initial?.id;

  const [term, setTerm] = useState(initial?.term ?? "");
  const [definition, setDefinition] = useState(initial?.definition ?? "");
  const [definitionSi, setDefinitionSi] = useState(initial?.definitionSi ?? "");
  const [exampleSentence, setExampleSentence] = useState(initial?.exampleSentence ?? "");
  const [bookId, setBookId] = useState(initial?.bookId ?? "");
  const [chapter, setChapter] = useState(initial?.chapter ?? "");
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
        definitionSi: definitionSi || null,
        exampleSentence: exampleSentence || undefined,
        bookId: bookId || null,
        chapter: chapter || null,
        ...(isEdit ? {} : { bankId }),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("common.error"));
      return;
    }

    if (onSaved) {
      onSaved();
      return;
    }
    router.push(!isEdit && bankId ? `/manage/banks/${bankId}` : "/vocab");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm(t("vocab.deleteConfirm", { term: initial.term }))) return;

    setDeleting(true);
    const res = await fetch(`/api/vocab/${initial.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      setError(t("vocab.deleteFailed"));
      return;
    }

    if (onDeleted) {
      onDeleted();
      return;
    }
    router.push("/vocab");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="term">{t("vocab.wordLabel")}</Label>
        <Input
          id="term"
          required
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder={t("vocab.wordPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="definition">{t("vocab.definitionLabel")}</Label>
        <Textarea
          id="definition"
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          placeholder={t("vocab.definitionPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="definitionSi">{t("vocab.definitionSiLabel")}</Label>
        <Textarea
          id="definitionSi"
          className="font-sinhala"
          value={definitionSi}
          onChange={(e) => setDefinitionSi(e.target.value)}
          placeholder={t("vocab.definitionSiPlaceholder")}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="exampleSentence">{t("vocab.exampleLabel")}</Label>
        <Textarea
          id="exampleSentence"
          value={exampleSentence}
          onChange={(e) => setExampleSentence(e.target.value)}
          placeholder={t("vocab.examplePlaceholder")}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="bookId">{t("vocab.bookLabel")}</Label>
          <Select id="bookId" value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="">{t("vocab.noBook")}</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="chapter">{t("vocab.chapterLabel")}</Label>
          <Input
            id="chapter"
            value={chapter}
            onChange={(e) => setChapter(e.target.value)}
            placeholder={t("vocab.chapterPlaceholder")}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? t("common.saving") : isEdit ? t("vocab.saveChanges") : t("vocab.addWordBtn")}
        </Button>
        {isEdit && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? t("vocab.deleting") : t("common.delete")}
          </Button>
        )}
      </div>
    </form>
  );
}
