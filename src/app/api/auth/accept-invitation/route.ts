import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/token";

const schema = z.object({
  token: z.string().min(16),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { token, password, confirmPassword } = parsed.data;
  if (password !== confirmPassword) {
    return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
  }

  const hashedToken = hashToken(token);
  const record = await db.invitationToken.findFirst({
    where: {
      tokenHash: hashedToken,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!record) {
    return NextResponse.json({ error: "Invitation is invalid or has expired" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { passwordHash, mustChangePassword: false },
    }),
    db.invitationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true, email: record.user.email });
}
