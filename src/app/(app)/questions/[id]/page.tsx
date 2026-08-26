import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { loadExamQuestionForEdit, loadExamQuestionForRead } from "@/lib/authz";
import { QuestionForm } from "@/components/questions/QuestionForm";
import { QuestionImages } from "@/components/questions/QuestionImages";
import { QuestionDetail } from "@/components/questions/QuestionDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  // Check edit rights first: admins/owners/content editors can always
  // manage a bank's questions even without a personal purchase
  // entitlement for it, so this must not fall through to the
  // entitlement-gated read path below.
  const editableQuestion = userId ? await loadExamQuestionForEdit(userId, id) : null;
  const question = editableQuestion ?? (userId ? await loadExamQuestionForRead(userId, id) : null);

  if (!question) {
    notFound();
  }

  const editable = !!editableQuestion;

  const [images, options] = await Promise.all([
    db.questionImage.findMany({
      where: { examQuestionId: id },
      orderBy: { order: "asc" },
    }),
    db.examQuestionOption.findMany({
      where: { examQuestionId: id },
      orderBy: { order: "asc" },
    }),
  ]);

  if (!editable) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Question</h1>
          <Link href="/questions" className={buttonVariants({ variant: "ghost" })}>
            Back to question bank
          </Link>
        </div>
        <Card>
          <CardContent className="pt-6">
            <QuestionDetail
              questionText={question.questionText}
              answerText={question.answerText}
              language={question.language}
              category={question.category}
              correctOptionLabel={question.correctOptionLabel}
              options={options}
              images={images}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

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
              options,
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
