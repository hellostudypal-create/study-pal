import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BankCardData {
  id: string;
  title: string;
  subtitle?: string | null;
  count: number;
  countLabel: string;
  standardExamQuestionCount?: number | null;
  coverImageUrl?: string | null;
}

export const bankCardClassName =
  "flex w-full flex-col overflow-hidden rounded-lg border border-border bg-card text-left transition-colors hover:border-primary/50";

export function BankCardContent({
  bank,
  icon: Icon,
  accentClassName,
}: {
  bank: BankCardData;
  icon: LucideIcon;
  accentClassName: string;
}) {
  return (
    <>
      {bank.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={bank.coverImageUrl} alt="" className="aspect-square w-full object-cover" />
      ) : (
        <div className={cn("flex aspect-square items-center justify-center", accentClassName)}>
          <Icon className="h-10 w-10 text-gold" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 text-base font-bold">{bank.title}</h3>
        {bank.subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{bank.subtitle}</p>}
        <p className="mt-auto pt-3 text-xs text-muted-foreground">
          {bank.count} {bank.countLabel}
        </p>
      </div>
    </>
  );
}
