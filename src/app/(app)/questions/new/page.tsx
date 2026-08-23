import { QuestionForm } from "@/components/questions/QuestionForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewQuestionPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Add a question</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New question bank entry</CardTitle>
        </CardHeader>
        <CardContent>
          <QuestionForm />
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Need to attach a figure or image answer options? Save the question first — you can add images from its edit page.
      </p>
    </div>
  );
}
