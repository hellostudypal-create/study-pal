import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BankCardData {
  id: string;
  title: string;
  subtitle?: string | null;
  count: number;
  countLabel: string;
}

export const bankCardClassName =
  "flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-primary/50";

export function BankCardContent({
  bank,
  icon: Icon,
  gradient,
}: {
  bank: BankCardData;
  icon: LucideIcon;
  gradient: string;
}) {
  return (
    <>
      <div className={cn("flex h-20 items-center justify-center bg-gradient-to-br text-white", gradient)}>
        <Icon className="h-7 w-7" />
      </div>
      <div className="flex flex-1 flex-col p-3">
        <h3 className="line-clamp-1 text-sm font-bold">{bank.title}</h3>
        {bank.subtitle && <p className="line-clamp-1 text-xs text-muted-foreground">{bank.subtitle}</p>}
        <p className="mt-auto pt-2 text-xs text-muted-foreground">
          {bank.count} {bank.countLabel}
        </p>
      </div>
    </>
  );
}
