import { db } from "@/lib/db";
import { BookForm } from "@/components/books/BookForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewBookPage() {
  const quizBanks = await db.bank.findMany({
    where: { kind: "exam" },
    orderBy: { title: "asc" },
    select: { id: true, title: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New book</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BookForm quizBanks={quizBanks} />
        </CardContent>
      </Card>
    </div>
  );
}
