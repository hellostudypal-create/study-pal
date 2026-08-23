import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertCanEditBank } from "@/lib/authz";
import { BankForm } from "@/components/banks/BankForm";
import { EntitlementManager } from "@/components/banks/EntitlementManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export default async function BankDetailPage({
  params,
}: {
  params: Promise<{ bankId: string }>;
}) {
  const { bankId } = await params;
  const userId = await getCurrentUserId();
  const bank = userId ? await assertCanEditBank(userId, bankId) : null;
  if (!bank) notFound();

  const entitlements = await db.entitlement.findMany({
    where: { bankId },
    include: { user: { select: { email: true, displayName: true } } },
    orderBy: { grantedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{bank.title}</h1>
        <Link
          href={`/manage/banks/${bankId}/import`}
          className={buttonVariants({ variant: "secondary" })}
        >
          Import content
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BankForm
            initial={{
              id: bank.id,
              kind: bank.kind,
              title: bank.title,
              description: bank.description ?? "",
              examCategory: bank.examCategory ?? "IQ",
              theme: bank.theme ?? "",
              price: bank.price?.toString() ?? "",
              isPublished: bank.isPublished,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Who has access</CardTitle>
        </CardHeader>
        <CardContent>
          <EntitlementManager
            bankId={bankId}
            initialEntitlements={entitlements.map((e) => ({
              id: e.id,
              source: e.source,
              grantedAt: e.grantedAt.toISOString(),
              user: e.user,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
