"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const ROLES = ["customer", "content_editor", "admin"] as const;

export function RoleSelector({
  userId,
  initialRole,
  isSelf,
}: {
  userId: string;
  initialRole: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [role, setRole] = useState(initialRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not update role");
      return;
    }
    router.refresh();
  }

  if (isSelf) {
    return <p className="text-sm text-muted-foreground">You can&apos;t change your own role.</p>;
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-44">
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {r.replace("_", " ")}
          </option>
        ))}
      </Select>
      <Button size="sm" onClick={handleSave} disabled={saving || role === initialRole}>
        {saving ? "Saving…" : "Save"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
