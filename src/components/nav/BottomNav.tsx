"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, HelpCircle, Trophy, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export const navItems = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/vocab", label: "Vocab", icon: BookOpen },
  { href: "/questions", label: "Questions", icon: HelpCircle },
  { href: "/quiz/vocab", label: "Quiz", icon: Trophy },
  { href: "/progress", label: "Progress", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-3xl items-stretch justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
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
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
