"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ROLES = ["customer", "content_editor", "admin"] as const;

async function sendInvitationMail(email: string, token: string) {
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const inviteUrl = `${appUrl.replace(/\/$/, "")}/accept-invitation?token=${encodeURIComponent(token)}`;
  const mailBaseUrl =
    process.env.NEXT_PUBLIC_MAIL_BASE_URL ?? "http://localhost:4000";
  const apiKey = process.env.NEXT_PUBLIC_STUDY_PAL_API_KEY ?? "";

  const res = await fetch(`${mailBaseUrl}/study-pal-mailer/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      to: email,
      subject: "Reset your StudyPal password",
      html: `
        <p>We received a request to set the password for your StudyPal account.</p>
        <p>Click the button below to choose a new password.</p>
        <p><a href="${inviteUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Reset password</a></p>
        <p>This link expires in 24 hours.</p>
      `,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to send invitation email");
  }
}

export function UserForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]>("customer");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        displayName: displayName || undefined,
        role,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    const data = await res.json().catch(() => ({}));
    const createdEmail = data.email as string | undefined;
    const createdToken = data.token as string | undefined;

    if (createdEmail && createdToken) {
      try {
        await sendInvitationMail(createdEmail, createdToken);
      } catch (mailError) {
        console.error("Invitation email failed", mailError);
      }
    }

    router.push("/manage/users");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">User details</CardTitle>
        <CardDescription>
          Create a user and send a secure invitation so they can choose their
          own password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Display name</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select
              id="role"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as (typeof ROLES)[number])
              }
            >
              {ROLES.map((value) => (
                <option key={value} value={value}>
                  {value.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create user"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/manage/users")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
