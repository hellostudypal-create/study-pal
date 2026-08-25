"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export interface EntitlementItem {
  id: string;
  source: string;
  grantedAt: string;
  bank: { id: string; title: string };
}

export interface GrantableBank {
  id: string;
  title: string;
}

export function UserEntitlements({
  userEmail,
  initialEntitlements,
  grantableBanks,
}: {
  userEmail: string;
  initialEntitlements: EntitlementItem[];
  grantableBanks: GrantableBank[];
}) {
  const [entitlements, setEntitlements] = useState(initialEntitlements);
  const [remaining, setRemaining] = useState(grantableBanks);
  const [selectedBankId, setSelectedBankId] = useState(grantableBanks[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBankId) return;
    setError(null);
    setLoading(true);

    const res = await fetch(`/api/banks/${selectedBankId}/entitlements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not grant access");
      return;
    }

    const data = await res.json();
    const grantedBank = remaining.find((b) => b.id === selectedBankId);
    if (grantedBank) {
      setEntitlements((prev) => [{ ...data.entitlement, bank: grantedBank }, ...prev]);
      setRemaining((prev) => prev.filter((b) => b.id !== selectedBankId));
    }
  }

  async function handleRevoke(id: string, bankId: string) {
    if (!confirm("Revoke access to this bank?")) return;
    const res = await fetch(`/api/entitlements/${id}`, { method: "DELETE" });
    if (res.ok) {
      const revoked = entitlements.find((e) => e.id === id);
      setEntitlements((prev) => prev.filter((e) => e.id !== id));
      if (revoked) setRemaining((prev) => [...prev, revoked.bank]);
    }
  }

  return (
    <div className="space-y-4">
      {remaining.length > 0 && (
        <form onSubmit={handleGrant} className="flex gap-2">
          <Select
            value={selectedBankId}
            onChange={(e) => setSelectedBankId(e.target.value)}
            className="flex-1"
          >
            {remaining.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={loading}>
            {loading ? "Granting…" : "Grant access"}
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {entitlements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No banks granted yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {entitlements.map((e) => (
            <li key={e.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{e.bank.title}</p>
                <p className="text-xs text-muted-foreground">
                  {e.source} · {new Date(e.grantedAt).toLocaleDateString()}
                </p>
              </div>
              {e.source !== "personal" && (
                <button
                  type="button"
                  onClick={() => handleRevoke(e.id, e.bank.id)}
                  className="text-xs text-destructive hover:underline"
                >
                  Revoke
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
