"use client";

import { useState } from "react";
import { Sidebar } from "@/components/nav/Sidebar";
import { cn } from "@/lib/utils";

const COLLAPSE_COOKIE = "sidebar-collapsed";

export function SidebarShell({
  defaultCollapsed,
  userName,
  signOutAction,
  isAdmin,
  isCustomer,
  children,
}: {
  defaultCollapsed: boolean;
  userName: string | null | undefined;
  signOutAction: () => Promise<void>;
  isAdmin: boolean;
  isCustomer: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      document.cookie = `${COLLAPSE_COOKIE}=${next ? "1" : "0"}; path=/; max-age=31536000; samesite=lax`;
      return next;
    });
  }

  return (
    <>
      <Sidebar
        userName={userName}
        signOutAction={signOutAction}
        isAdmin={isAdmin}
        isCustomer={isCustomer}
        collapsed={collapsed}
        onToggle={toggle}
      />
      <div className={cn(collapsed ? "lg:pl-[72px]" : "lg:pl-60")}>
        <main className="mx-auto max-w-3xl px-4 py-6 pb-20 lg:max-w-5xl lg:px-8 lg:pb-10">{children}</main>
      </div>
    </>
  );
}
