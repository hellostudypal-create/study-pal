import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const updateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(30).optional().nullable(),
  currentPassword: z.string().optional(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { displayName, email, phone, currentPassword } = parsed.data;

  const existing = await db.user.findUnique({ where: { id: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (email && email !== existing.email) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Current password is required to change email" },
        { status: 400 }
      );
    }
    const valid = await bcrypt.compare(currentPassword, existing.passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });

    const taken = await db.user.findUnique({ where: { email } });
    if (taken) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(displayName !== undefined ? { displayName } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(phone !== undefined ? { phone } : {}),
    },
    select: { id: true, email: true, displayName: true, phone: true, role: true, createdAt: true },
  });

  return NextResponse.json({ user });
}
