"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface BankContentItem {
  id: string;
  title: string;
  subtitle?: string | null;
}

export function BankContentList({
  kind,
  items,
}: {
  kind: "exam" | "vocab";
  items: BankContentItem[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState(items);
  const [error, setError] = useState<string | null>(null);

  const editHref = (id: string) => (kind === "exam" ? `/questions/${id}` : `/vocab/${id}`);
  const deleteUrl = (id: string) => (kind === "exam" ? `/api/questions/${id}` : `/api/vocab/${id}`);

  async function handleDelete(id: string) {
    if (!confirm("Delete this item? This can't be undone.")) return;
    setError(null);
    const res = await fetch(deleteUrl(id), { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
    router.refresh();
  }

  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No content in this bank yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-destructive">{error}</p>}
      <ul className="divide-y divide-border rounded-md border border-border">
        {rows.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <Link href={editHref(item.id)} className="min-w-0 flex-1 hover:underline">
              <p className="truncate font-medium">{item.title}</p>
              {item.subtitle && <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>}
            </Link>
            <button
              type="button"
              onClick={() => handleDelete(item.id)}
              className="shrink-0 text-xs text-destructive hover:underline"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
