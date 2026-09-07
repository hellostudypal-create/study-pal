"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/nav/BottomNav";
import { ThemeToggle } from "@/components/nav/ThemeToggle";
import { Logo } from "@/components/brand/Logo";

export function Sidebar({
  userName,
  signOutAction,
  isAdmin,
}: {
  userName: string | null | undefined;
  signOutAction: () => Promise<void>;
  isAdmin: boolean;
}) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-border bg-background-2 p-4 lg:flex">
      <div className="flex items-center justify-between px-2 pb-6">
        <Logo />
        <ThemeToggle />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-[19px] w-[19px] shrink-0" />
              {label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/manage"
            className={cn(
              "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors",
              pathname.startsWith("/manage")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Settings className="h-[19px] w-[19px] shrink-0" />
            Manage
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-border px-2 pt-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-bold text-brand">
          {userName?.slice(0, 2).toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{userName}</p>
          <form action={signOutAction}>
            <button
              type="submit"
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
