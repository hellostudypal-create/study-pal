import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/ui/Markdown";
import { SpeakablePhrase } from "@/components/books/SpeakablePhrase";

export interface PhraseCardData {
  id: string;
  phrase: string;
  translationSi: string | null;
  pronunciationSi: string | null;
  explanation: string;
  explanationSi: string | null;
}

export function PhraseCard({
  phrase,
  number,
  speechEnabled = false,
}: {
  phrase: PhraseCardData;
  number?: number;
  speechEnabled?: boolean;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5">
        <div className="flex gap-3.5">
          {number != null && (
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-tint text-xs font-bold text-primary">
              {number}
            </span>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            {speechEnabled ? (
              <SpeakablePhrase text={phrase.phrase} className="text-lg font-bold leading-snug" />
            ) : (
              <p className="text-lg font-bold leading-snug">{phrase.phrase}</p>
            )}
            {phrase.pronunciationSi && (
              <p className="font-sinhala text-sm italic text-muted-foreground">{phrase.pronunciationSi}</p>
            )}
            {phrase.translationSi && (
              <p className="font-sinhala text-base text-primary">{phrase.translationSi}</p>
            )}
            <div className="space-y-3 rounded-sm bg-muted p-3.5">
              <Markdown className="text-sm text-foreground">{phrase.explanation}</Markdown>
              {phrase.explanationSi && (
                <Markdown className="font-sinhala text-sm text-foreground">{phrase.explanationSi}</Markdown>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
