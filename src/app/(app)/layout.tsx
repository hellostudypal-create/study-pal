import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { BottomNav } from "@/components/nav/BottomNav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <span className="text-lg font-bold tracking-tight">Study Pal</span>
          <div className="flex items-center gap-3">
            {session?.user?.role === "admin" && (
              <Link
                href="/manage"
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Manage
              </Link>
            )}
            <span className="text-sm text-muted-foreground">
              {session?.user?.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
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
      <main className="mx-auto max-w-3xl px-4 py-6 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
