import { BookForm } from "@/components/books/BookForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New book</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BookForm />
        </CardContent>
      </Card>
    </div>
  );
}
