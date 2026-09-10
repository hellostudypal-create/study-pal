import Link from "next/link";
import { cookies } from "next/headers";
import { LogOut, Settings } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { BottomNav } from "@/components/nav/BottomNav";
import { SidebarShell } from "@/components/nav/SidebarShell";
import { LogoBadge } from "@/components/brand/Logo";
import { getT } from "@/lib/i18n/translate";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  // Default to treating a missing role as a customer (fails closed): a
  // signed-in session should always carry a role, but if it somehow
  // doesn't, hide the not-yet-enabled personal vocab/question bank nav
  // items rather than show them.
  const isCustomer = (session?.user?.role ?? "customer") === "customer";
  const t = await getT();
  const cookieStore = await cookies();
  const sidebarCollapsed = cookieStore.get("sidebar-collapsed")?.value === "1";

  return (
    <div className="min-h-screen bg-brand-light-tint">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" aria-label={t("nav.appName")}>
            <LogoBadge />
          </Link>
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <Link
                href="/manage"
                title={t("nav.manage")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Settings className="h-[18px] w-[18px]" />
              </Link>
            )}
            <Link href="/account" title={t("account.title")}>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-bold text-brand">
                {session?.user?.name?.slice(0, 2).toUpperCase() ?? "?"}
              </div>
            </Link>
            <form action={signOutAction}>
              <button
                type="submit"
                title={t("nav.signOut")}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <SidebarShell
        defaultCollapsed={sidebarCollapsed}
        userName={session?.user?.name}
        signOutAction={signOutAction}
        isAdmin={isAdmin}
        isCustomer={isCustomer}
      >
        {children}
      </SidebarShell>
      <BottomNav />
    </div>
  );
}
