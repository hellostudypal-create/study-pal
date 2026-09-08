"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/useTranslation";

export interface AccountFormValues {
  displayName: string;
  email: string;
  phone: string;
}

export function AccountForm({
  initial,
  roleLabel,
  memberSince,
}: {
  initial: AccountFormValues;
  roleLabel: string;
  memberSince: string;
}) {
  const router = useRouter();
  const { update } = useSession();
  const { t } = useTranslation();

  const [displayName, setDisplayName] = useState(initial.displayName);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone);
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailChanged = email !== initial.email;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName,
        email,
        phone: phone || null,
        ...(emailChanged ? { currentPassword } : {}),
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("common.error"));
      return;
    }

    await update({ name: displayName, email });
    setCurrentPassword("");
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="displayName">{t("account.displayName")}</Label>
        <Input id="displayName" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("account.email")}</Label>
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      {emailChanged && (
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">{t("account.currentPasswordForEmail")}</Label>
          <Input
            id="currentPassword"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="phone">{t("account.phone")}</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <p className="text-xs text-muted-foreground">{t("account.phoneHint")}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border pt-4 text-sm">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("account.role")}</p>
          <p className="mt-0.5 font-semibold">{roleLabel}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-muted-foreground">{t("account.memberSince")}</p>
          <p className="mt-0.5 font-semibold">{memberSince}</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-success">{t("account.profileSaved")}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? t("common.saving") : t("account.saveProfile")}
      </Button>
    </form>
  );
}
