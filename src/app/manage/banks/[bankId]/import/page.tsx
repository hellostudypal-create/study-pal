import { notFound } from "next/navigation";
import { getCurrentUserId } from "@/lib/auth";
import { assertCanEditBank } from "@/lib/authz";
import { BulkImportForm } from "@/components/banks/BulkImportForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function BankImportPage({
  params,
}: {
  params: Promise<{ bankId: string }>;
}) {
  const { bankId } = await params;
  const userId = await getCurrentUserId();
  const bank = userId ? await assertCanEditBank(userId, bankId) : null;
  if (!bank) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Import into {bank.title}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Paste content</CardTitle>
          <CardDescription>
            Separate each {bank.kind === "exam" ? "question" : "word"} with a line containing
            just <code>---</code>. Labeled lines (like {bank.kind === "exam" ? '"Answer:"' : '"Definition:"'}) can be
            reordered or omitted where optional.
            {bank.kind === "exam" && (
              <> For real multiple-choice, use <code>A:</code>/<code>B:</code>/<code>C:</code>/<code>D:</code> lines
              instead of <code>Answer:</code>, followed by <code>Correct: &lt;letter&gt;</code>.</>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BulkImportForm bankId={bankId} kind={bank.kind} />
        </CardContent>
      </Card>
    </div>
  );
}
