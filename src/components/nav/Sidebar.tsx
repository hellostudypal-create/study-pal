"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/nav/BottomNav";
import { Logo, LogoBadge } from "@/components/brand/Logo";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function Sidebar({
  userName,
  signOutAction,
  isAdmin,
  isCustomer,
  collapsed = false,
  onToggle,
}: {
  userName: string | null | undefined;
  signOutAction: () => Promise<void>;
  isAdmin: boolean;
  isCustomer: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-10 hidden flex-col border-r border-border bg-background-2 p-4 lg:flex",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? t("nav.expandSidebar") : t("nav.collapseSidebar")}
          className="absolute -right-3 top-6 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm hover:text-foreground"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      )}

      <div className={cn("flex items-center pb-6", collapsed ? "justify-center px-0" : "px-2")}>
        {collapsed ? <LogoBadge /> : <Logo textClassName="text-base font-extrabold tracking-tight" />}
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.filter((item) => item.customerVisible || !isCustomer).map(({ href, key, icon: Icon }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? t(`nav.${key}`) : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary"
              )}
            >
              <Icon className="h-[19px] w-[19px] shrink-0" />
              {!collapsed && t(`nav.${key}`)}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/manage"
            title={collapsed ? t("nav.manage") : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3.5 py-2.5 text-sm font-semibold transition-colors",
              collapsed && "justify-center px-0",
              pathname?.startsWith("/manage")
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Settings className="h-[19px] w-[19px] shrink-0" />
            {!collapsed && t("nav.manage")}
          </Link>
        )}
      </nav>

      <div
        className={cn(
          "flex items-center gap-1.5 border-t border-border pt-4",
          collapsed ? "flex-col px-0" : "px-2"
        )}
      >
        <Link
          href="/account"
          title={collapsed ? t("account.title") : undefined}
          className={cn(
            "flex min-w-0 items-center gap-2.5 rounded-md py-1 hover:bg-secondary",
            collapsed ? "justify-center px-1" : "flex-1 px-1"
          )}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold text-xs font-bold text-brand">
            {userName?.slice(0, 2).toUpperCase() ?? "?"}
          </div>
          {!collapsed && <p className="min-w-0 truncate text-sm font-semibold">{userName}</p>}
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            title={t("nav.signOut")}
            className={cn(
              "flex shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground",
              collapsed ? "h-7 w-7" : "h-8 w-8"
            )}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
