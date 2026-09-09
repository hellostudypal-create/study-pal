"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Library, HelpCircle, Trophy, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

export const navItems = [
  { href: "/dashboard", key: "home", icon: LayoutDashboard },
  { href: "/vocab", key: "vocab", icon: BookOpen },
  { href: "/questions", key: "questions", icon: HelpCircle },
  { href: "/books", key: "books", icon: Library },
  { href: "/quiz", key: "quiz", icon: Trophy },
  { href: "/progress", key: "progress", icon: BarChart3 },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-3xl items-stretch justify-around">
        {navItems.map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-10 items-center justify-center rounded-full",
                  active && "bg-primary-tint"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {t(`nav.${key}`)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
