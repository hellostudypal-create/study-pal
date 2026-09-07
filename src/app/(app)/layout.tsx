import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { BottomNav } from "@/components/nav/BottomNav";
import { Sidebar } from "@/components/nav/Sidebar";
import { ThemeToggle } from "@/components/nav/ThemeToggle";

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

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-lg font-extrabold tracking-tight">Study Pal</span>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/manage"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Manage
              </Link>
            )}
            <span className="text-sm text-muted-foreground">{session?.user?.name}</span>
            <ThemeToggle />
            <form action={signOutAction}>
              <button
                type="submit"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <Sidebar userName={session?.user?.name} signOutAction={signOutAction} isAdmin={isAdmin} />

      <div className="lg:pl-60">
        <main className="mx-auto max-w-3xl px-4 py-6 pb-20 lg:max-w-5xl lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
