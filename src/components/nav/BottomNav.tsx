"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BookOpen, Library, HelpCircle, Trophy, BarChart3, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

// The full nav, used by the desktop sidebar. `mobile: false` entries are
// left out of the phone bottom tab bar, which has room for far fewer tabs
// - vocab/questions are still reachable from quiz and the desktop sidebar.
// `customerVisible: false` entries are also hidden from customer accounts
// entirely (see Sidebar's isCustomer filtering): /vocab and /questions let
// a signed-in user write into their own personal bank, a "build your own
// vocab/question bank" feature that isn't turned on for customers yet (see
// canEditBank in src/lib/authz.ts). Flip this back on alongside that check
// once the feature ships.
export const navItems = [
  { href: "/dashboard", key: "home", icon: LayoutDashboard, mobile: true, customerVisible: true },
  { href: "/vocab", key: "vocab", icon: BookOpen, mobile: false, customerVisible: false },
  { href: "/questions", key: "questions", icon: HelpCircle, mobile: false, customerVisible: false },
  { href: "/books", key: "books", icon: Library, mobile: true, customerVisible: true },
  { href: "/quiz", key: "quiz", icon: Trophy, mobile: true, customerVisible: true },
  { href: "/progress", key: "progress", icon: BarChart3, mobile: true, customerVisible: true },
  { href: "/store", key: "store", icon: Store, mobile: true, customerVisible: true },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-3xl items-stretch justify-around">
        {navItems.filter((item) => item.mobile).map(({ href, key, icon: Icon }) => {
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
