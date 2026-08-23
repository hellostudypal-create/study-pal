import { WordForm } from "@/components/vocab/WordForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewWordPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Add a word</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">New vocabulary entry</CardTitle>
        </CardHeader>
        <CardContent>
          <WordForm />
        </CardContent>
      </Card>
    </div>
  );
}
