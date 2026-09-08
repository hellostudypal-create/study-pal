import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashToken, generateToken } from "@/lib/token";

const schema = z.object({
  email: z.string().trim().email(),
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

  const email = parsed.data.email.toLowerCase();

  const user = await db.user.findUnique({ where: { email } });

  if (user) {
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60);

    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });

    return NextResponse.json({
      message: "If an account exists for this email, you will receive a password reset link.",
      email: user.email,
      token,
    });
  }

  return NextResponse.json({
    message: "If an account exists for this email, you will receive a password reset link.",
  });
}
