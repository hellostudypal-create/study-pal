"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/useTranslation";

export type StoreItem = {
  id: string;
  title: string;
  description: string | null;
  kind: "exam" | "vocab" | "book";
  subtitle: string | null;
  itemCount: number;
  priceLabel: string | null;
  owned: boolean;
  imageUrl: string;
};

const FILTERS = [
  { key: "all", dictKey: "store.all" },
  { key: "exam", dictKey: "store.exam" },
  { key: "vocab", dictKey: "store.vocabulary" },
  { key: "book", dictKey: "store.books" },
] as const;

export function StoreGrid({ items }: { items: StoreItem[] }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("all");

  const counts = useMemo(
    () => ({
      all: items.length,
      exam: items.filter((item) => item.kind === "exam").length,
      vocab: items.filter((item) => item.kind === "vocab").length,
      book: items.filter((item) => item.kind === "book").length,
    }),
    [items]
  );

  const visible = filter === "all" ? items : items.filter((item) => item.kind === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
              filter === f.key
                ? "border-transparent bg-brand text-white shadow-sm"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {t(f.dictKey)}
            <span
              className={cn(
                "ml-1.5 text-xs font-normal",
                filter === f.key ? "text-white/70" : "text-muted-foreground/70"
              )}
            >
              {counts[f.key]}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-muted-foreground">{t("store.empty")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <StoreCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

const KIND_LABEL_KEY = { exam: "store.exam", vocab: "store.vocabulary", book: "store.books" } as const;

function StoreCard({ item }: { item: StoreItem }) {
  const { t } = useTranslation();
  const href = item.kind === "book" ? `/store/books/${item.id}` : `/store/${item.id}`;
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-light-tint">
        <img
          src={item.imageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent" />
        <span
          className={cn(
            "absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[11px] font-bold backdrop-blur",
            item.kind === "exam" ? "bg-brand/85 text-white" : item.kind === "book" ? "bg-primary/85 text-white" : "bg-gold text-brand"
          )}
        >
          {t(KIND_LABEL_KEY[item.kind])}
        </span>
        {item.owned && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-success px-2.5 py-1 text-[11px] font-bold text-white">
            {t("store.owned")}
          </span>
        )}
      </div>

      {item.priceLabel && (
        <div className="relative">
          <span className="absolute -top-3 right-3 rounded-full bg-gold px-3 py-1 text-xs font-extrabold text-brand shadow-md">
            {item.priceLabel}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4 pt-5">
        <h2 className="line-clamp-1 text-base font-bold transition-colors group-hover:text-primary">
          {item.title}
        </h2>
        {item.subtitle && <p className="text-xs font-medium text-muted-foreground">{item.subtitle}</p>}
        {item.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs text-muted-foreground">
            {item.itemCount}{" "}
            {item.kind === "exam"
              ? t("store.questionsCount")
              : item.kind === "book"
                ? t("store.chaptersCount")
                : t("store.wordsCount")}
          </span>
          <span className="text-xs font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
            {t("store.view")}
          </span>
        </div>
      </div>
    </Link>
  );
}
