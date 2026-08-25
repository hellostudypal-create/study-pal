import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { RoleSelector } from "@/components/users/RoleSelector";
import { UserEntitlements } from "@/components/users/UserEntitlements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ManageUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await auth();

  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      entitlements: {
        where: { bank: { isPersonal: false } },
        include: { bank: { select: { id: true, title: true } } },
        orderBy: { grantedAt: "desc" },
      },
    },
  });

  if (!user) notFound();

  const ownedBankIds = user.entitlements.map((e) => e.bank.id);
  const grantableBanks = await db.bank.findMany({
    where: { isPersonal: false, isPublished: true, id: { notIn: ownedBankIds } },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{user.displayName ?? user.email}</h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Role</CardTitle>
        </CardHeader>
        <CardContent>
          <RoleSelector userId={user.id} initialRole={user.role} isSelf={user.id === session?.user?.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Banks</CardTitle>
        </CardHeader>
        <CardContent>
          <UserEntitlements
            userEmail={user.email}
            initialEntitlements={user.entitlements.map((e) => ({
              id: e.id,
              source: e.source,
              grantedAt: e.grantedAt.toISOString(),
              bank: e.bank,
            }))}
            grantableBanks={grantableBanks}
          />
        </CardContent>
      </Card>
    </div>
  );
}
