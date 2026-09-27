import Link from "next/link";
import { auth } from "@/lib/auth";
import { LogoBadge } from "@/components/brand/Logo";
import { getT } from "@/lib/i18n/translate";

export default async function NotFound() {
  const session = await auth();
  const t = await getT();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-light-tint px-4 py-10 text-center">
      <Link href={session ? "/dashboard" : "/store"} className="mb-10 flex items-center gap-3">
        <LogoBadge className="h-10 w-10 rounded-xl" />
        <span className="text-xl font-extrabold tracking-tight">Study Pal</span>
      </Link>

      <p className="bg-gradient-to-br from-brand to-brand-2 bg-clip-text text-8xl font-extrabold tracking-tighter text-transparent sm:text-9xl">
        404
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{t("notFound.title")}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{t("notFound.body")}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {session ? (
          <Link
            href="/dashboard"
            className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("notFound.goToDashboard")}
          </Link>
        ) : null}
        <Link
          href="/store"
          className={
            session
              ? "rounded-md border border-border bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted"
              : "rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          }
        >
          {t("notFound.browseStore")}
        </Link>
      </div>
    </div>
  );
}
