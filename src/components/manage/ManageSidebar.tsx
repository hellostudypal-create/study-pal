"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Library, Users, BookOpen, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/nav/ThemeToggle";

const navItems = [
  { href: "/manage", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/manage/banks", label: "Banks", icon: Library, exact: false },
  { href: "/manage/books", label: "Books", icon: BookOpen, exact: false },
  { href: "/manage/users", label: "Users", icon: Users, exact: false },
];

export function ManageSidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r border-border bg-background-2 p-4 lg:flex">
        <div className="flex items-center justify-between px-2 pb-6">
          <Link href="/manage" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-2 text-sm font-extrabold text-primary-foreground shadow-lg shadow-primary/30">
              S
            </div>
            <span className="text-lg font-extrabold tracking-tight">Manage</span>
          </Link>
          <ThemeToggle />
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/35"
                    : "text-muted-foreground hover:bg-secondary"
                )}
              >
                <Icon className="h-[19px] w-[19px] shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-md border-t border-border px-3.5 pt-4 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-[18px] w-[18px]" />
          Back to app
        </Link>
      </aside>

      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/manage" className="text-lg font-extrabold tracking-tight">
            Manage
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Back to app
            </Link>
          </div>
        </div>
        <nav className="flex items-stretch justify-around border-t border-border">
          {navItems.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex-1 py-2 text-center text-sm font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </header>
    </>
  );
}
