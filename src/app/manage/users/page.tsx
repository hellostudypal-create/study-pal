import Link from "next/link";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";

export default async function ManageUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
      createdAt: true,
      _count: { select: { entitlements: { where: { bank: { isPersonal: false } } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Users</h1>
        <Link href="/manage/users/new" className={buttonVariants()}>
          + New user
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Banks owned</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-secondary/50">
                <td className="px-4 py-3">
                  <Link href={`/manage/users/${u.id}`} className="font-medium hover:underline">
                    {u.displayName ?? u.email}
                  </Link>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-primary-tint px-2.5 py-1 text-[11px] font-bold capitalize text-primary">
                    {u.role.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">{u._count.entitlements}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {u.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
