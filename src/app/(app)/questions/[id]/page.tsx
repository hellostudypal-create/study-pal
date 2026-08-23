import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { loadExamQuestionForEdit } from "@/lib/authz";
import { QuestionForm } from "@/components/questions/QuestionForm";
import { QuestionImages } from "@/components/questions/QuestionImages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const question = userId ? await loadExamQuestionForEdit(userId, id) : null;

  if (!question) {
    notFound();
  }

  const images = await db.questionImage.findMany({
    where: { examQuestionId: id },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Edit question</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question bank entry</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm
            initial={{
              id: question.id,
              questionText: question.questionText,
              answerText: question.answerText,
              language: question.language,
              category: question.category ?? "",
              correctOptionLabel: question.correctOptionLabel ?? "",
            }}
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Images</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionImages questionId={question.id} initialImages={images} />
        </CardContent>
      </Card>
    </div>
  );
}
