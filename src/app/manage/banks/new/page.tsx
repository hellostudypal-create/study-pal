import { BankForm } from "@/components/banks/BankForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewBankPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">New bank</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BankForm />
        </CardContent>
      </Card>
    </div>
  );
}
