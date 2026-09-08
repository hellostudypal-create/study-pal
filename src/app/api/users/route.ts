import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateToken, hashToken } from "@/lib/token";

const createSchema = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().max(100).optional(),
  role: z.enum(["customer", "content_editor", "admin"]).default("customer"),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, displayName, role } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const tempPassword = generateToken();
  const passwordHash = await bcrypt.hash(tempPassword, 12);

  const created = await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        displayName: displayName ?? email.split("@")[0],
        role,
        passwordHash,
        mustChangePassword: true,
      },
      select: { id: true, email: true, displayName: true, role: true, mustChangePassword: true },
    });

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

    await tx.invitationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        expiresAt,
      },
    });

    return { user, token };
  });

  return NextResponse.json(
    {
      message: "User created.",
      user: created.user,
      email: created.user.email,
      token: created.token,
    },
    { status: 201 }
  );
}
