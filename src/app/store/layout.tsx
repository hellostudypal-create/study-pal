import Link from "next/link";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/brand/Logo";
import { getT } from "@/lib/i18n/translate";

export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const t = await getT();

  return (
    <div className="min-h-screen bg-brand-light-tint">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
          <Link href="/store">
            <Logo />
          </Link>
          <div className="flex items-center gap-4">
            {session?.user ? (
              <>
                <span className="text-sm text-muted-foreground">{session.user.name}</span>
                <Link
                  href="/dashboard"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {t("store.dashboard")}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                >
                  {t("store.logIn")}
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {t("store.signUp")}
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
