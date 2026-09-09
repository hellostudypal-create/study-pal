"use client";

import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface WordDetailValues {
  term: string;
  definition: string | null;
  definitionSi?: string | null;
  exampleSentence: string | null;
  bookTitle?: string | null;
  chapter?: string | null;
}

export function WordDetail({ term, definition, definitionSi, exampleSentence, bookTitle, chapter }: WordDetailValues) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-semibold">{term}</h2>
        {bookTitle && (
          <Badge variant="outline">{chapter ? t("vocab.fromChapter", { book: bookTitle, chapter }) : bookTitle}</Badge>
        )}
      </div>
      {definition ? (
        <p className="text-sm text-foreground">{definition}</p>
      ) : (
        <p className="text-sm text-muted-foreground">{t("vocab.noDefinitionYet")}</p>
      )}
      {definitionSi && (
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("vocab.definitionSiHeading")}
          </p>
          <p className="mt-1 font-sinhala text-sm text-foreground">{definitionSi}</p>
        </div>
      )}
      {exampleSentence && (
        <div className="rounded-md border border-dashed border-border p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("vocab.exampleHeading")}</p>
          <p className="mt-1 text-sm italic">{exampleSentence}</p>
        </div>
      )}
    </div>
  );
}
