import { QuestionForm } from "@/components/questions/QuestionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n/translate";

export default async function NewQuestionPage({
  searchParams,
}: {
  searchParams: Promise<{ bankId?: string }>;
}) {
  const { bankId } = await searchParams;
  const t = await getT();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{t("questions.addQuestionTitle")}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("questions.newEntry")}</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm bankId={bankId} />
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">{t("questions.imageHint")}</p>
    </div>
  );
}
