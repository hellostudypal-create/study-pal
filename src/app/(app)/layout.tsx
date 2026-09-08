import Link from "next/link";
import { cookies } from "next/headers";
import { auth, signOut } from "@/lib/auth";
import { BottomNav } from "@/components/nav/BottomNav";
import { SidebarShell } from "@/components/nav/SidebarShell";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { LanguageToggle } from "@/components/nav/LanguageToggle";
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
  const t = await getT();
  const cookieStore = await cookies();
  const sidebarCollapsed = cookieStore.get("sidebar-collapsed")?.value === "1";

  return (
    <div className="min-h-screen bg-brand-light-tint">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-lg font-extrabold tracking-tight">{t("nav.appName")}</span>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/manage"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("nav.manage")}
              </Link>
            )}
            <Link
              href="/account"
              className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              {session?.user?.name}
            </Link>
            <LanguageToggle />
            <ThemeToggle />
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("nav.signOut")}
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
      >
        {children}
      </SidebarShell>
      <BottomNav />
    </div>
  );
}
