"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface BookEntitlementItem {
  id: string;
  source: string;
  grantedAt: string;
  user: { email: string; displayName: string | null };
}

export function BookEntitlementManager({
  bookId,
  initialEntitlements,
}: {
  bookId: string;
  initialEntitlements: BookEntitlementItem[];
}) {
  const [entitlements, setEntitlements] = useState(initialEntitlements);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/books/${bookId}/entitlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not grant access");
      return;
    }

    const data = await res.json();
    setEntitlements((prev) => [data.entitlement, ...prev.filter((e) => e.id !== data.entitlement.id)]);
    setEmail("");
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this user's access to the book?")) return;
    const res = await fetch(`/api/book-entitlements/${id}`, { method: "DELETE" });
    if (res.ok) {
      setEntitlements((prev) => prev.filter((e) => e.id !== id));
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleGrant} className="flex gap-2">
        <Input
          type="email"
          required
          placeholder="buyer@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Granting…" : "Grant access"}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}

      {entitlements.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nobody has access to this book yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {entitlements.map((e) => (
            <li key={e.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{e.user.displayName ?? e.user.email}</p>
                <p className="text-xs text-muted-foreground">{e.user.email} · {e.source}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(e.id)}
                className="text-xs text-destructive hover:underline"
              >
                Revoke
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
