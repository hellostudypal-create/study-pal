import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { WordForm } from "@/components/vocab/WordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditWordPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const word = userId ? await db.vocabWord.findUnique({ where: { id } }) : null;

  if (!word || word.userId !== userId) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">{word.term}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Edit entry</CardTitle>
        </CardHeader>
        <CardContent>
          <WordForm
            initial={{
              id: word.id,
              term: word.term,
              definition: word.definition ?? "",
              exampleSentence: word.exampleSentence ?? "",
              sourceBook: word.sourceBook ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
