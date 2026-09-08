"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function sendResetMail(email: string, token: string) {
  const appUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${encodeURIComponent(token)}`;
  const mailBaseUrl = process.env.NEXT_PUBLIC_MAIL_BASE_URL ?? "http://localhost:4000";
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
        <h2>Reset your password</h2>
        <p>We received a request to reset the password for your StudyPal account.</p>
        <p>Click the button below to choose a new password.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Reset password</a></p>
        <p>This link expires in 60 minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
      `,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to send password reset email");
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      return;
    }

    const data = await res.json().catch(() => ({}));
    const payloadEmail = typeof data.email === "string" ? data.email : undefined;
    const payloadToken = typeof data.token === "string" ? data.token : undefined;

    if (payloadEmail && payloadToken) {
      try {
        await sendResetMail(payloadEmail, payloadToken);
      } catch (mailError) {
        console.error("Password reset email failed", mailError);
      }
    }

    setSent(true);
  }

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            If an account exists for that address, a password reset link has been sent.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            You can close this page and return to the login screen when you&apos;re ready.
          </p>
          <Link href="/login" className="inline-flex items-center text-sm font-medium text-primary underline-offset-4 hover:underline">
            Back to login
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password</CardTitle>
        <CardDescription>Enter your email to receive a reset link.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to login
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
