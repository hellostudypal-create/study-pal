import { Card, CardContent } from "@/components/ui/card";
import { Markdown } from "@/components/ui/Markdown";

export interface PhraseCardData {
  id: string;
  phrase: string;
  translationSi: string | null;
  pronunciationSi: string | null;
  explanation: string;
  explanationSi: string | null;
}

export function PhraseCard({ phrase }: { phrase: PhraseCardData }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-5">
        <p className="text-lg font-bold leading-snug">{phrase.phrase}</p>
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
      </CardContent>
    </Card>
  );
}
