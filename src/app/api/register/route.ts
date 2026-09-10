import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  displayName: z.string().min(1).max(100).optional(),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { email, password, displayName } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      passwordHash,
      displayName: displayName ?? email.split("@")[0],
    },
    select: { id: true, email: true },
  });

  // New signups used to get an empty personal vocab/exam bank provisioned
  // here (see getOrCreatePersonalBank in src/lib/authz.ts), for a "build
  // your own bank" feature. Customer writes to personal banks are disabled
  // for now (see canEditBank), so provisioning one up front just leaves a
  // permanently-empty, unusable bank cluttering the customer's quiz page.
  // getOrCreatePersonalBank still runs lazily wherever it's needed, so
  // re-enabling the feature later doesn't require touching this route.

  return NextResponse.json({ user }, { status: 201 });
}
