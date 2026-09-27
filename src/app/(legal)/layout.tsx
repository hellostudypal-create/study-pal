import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-light-tint">
      <header className="border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-8">
          <Link href="/store">
            <Logo />
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground hover:underline">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground hover:underline">
              Privacy
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-8">
        <article className="rounded-xl border border-border bg-background p-6 sm:p-10 [&_h1]:mb-2 [&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6 [&_a]:text-primary [&_a]:underline">
          {children}
        </article>
      </main>
    </div>
  );
}
