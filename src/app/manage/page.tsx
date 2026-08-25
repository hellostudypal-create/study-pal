import Link from "next/link";
import { db } from "@/lib/db";

export default async function ManageDashboardPage() {
  const [customerCount, publishedBanks, draftBanks, manualGrants, recentSignups, recentGrants] =
    await Promise.all([
      db.user.count({ where: { role: "customer" } }),
      db.bank.count({ where: { isPersonal: false, isPublished: true } }),
      db.bank.count({ where: { isPersonal: false, isPublished: false } }),
      db.entitlement.findMany({
        where: { source: "manual_grant" },
        select: { bank: { select: { price: true } } },
      }),
      db.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, email: true, displayName: true, role: true, createdAt: true },
      }),
      db.entitlement.findMany({
        where: { source: "manual_grant" },
        orderBy: { grantedAt: "desc" },
        take: 5,
        include: {
          user: { select: { email: true, displayName: true } },
          bank: { select: { title: true, price: true } },
        },
      }),
    ]);

  const estimatedRevenue = manualGrants.reduce((sum, e) => sum + Number(e.bank.price ?? 0), 0);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Customers" value={customerCount} />
        <StatCard label="Estimated revenue" value={`Rs. ${estimatedRevenue.toLocaleString()}`} />
        <StatCard label="Published banks" value={publishedBanks} />
        <StatCard label="Draft banks" value={draftBanks} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-muted-foreground">Recent signups</h2>
          {recentSignups.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No signups yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {recentSignups.map((u) => (
                <li key={u.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <Link href={`/manage/users/${u.id}`} className="font-medium hover:underline">
                      {u.displayName ?? u.email}
                    </Link>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-xs capitalize text-muted-foreground">{u.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-sm font-bold text-muted-foreground">Recent grants</h2>
          {recentGrants.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No manual grants yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {recentGrants.map((e) => (
                <li key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium">{e.user.displayName ?? e.user.email}</p>
                    <p className="text-xs text-muted-foreground">{e.bank.title}</p>
                  </div>
                  {e.bank.price != null && (
                    <span className="text-xs font-semibold text-primary">
                      Rs. {Number(e.bank.price).toLocaleString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-sm border border-border bg-card p-4 text-center">
      <p className="text-xl font-extrabold text-primary">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
