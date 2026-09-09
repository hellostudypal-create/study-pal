import { SourceBookForm } from "@/components/books/SourceBookForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewSourceBookPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New source book</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <SourceBookForm />
        </CardContent>
      </Card>
    </div>
  );
}
