import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { assertCanEditBank } from "@/lib/authz";

const grantSchema = z.object({
  email: z.string().email(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bankId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bankId } = await params;
  const bank = await assertCanEditBank(session.user.id, bankId);
  if (!bank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entitlements = await db.entitlement.findMany({
    where: { bankId },
    include: { user: { select: { email: true, displayName: true } } },
    orderBy: { grantedAt: "desc" },
  });

  return NextResponse.json({ entitlements });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bankId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bankId } = await params;
  const bank = await assertCanEditBank(session.user.id, bankId);
  if (!bank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = grantSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const targetUser = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!targetUser) {
    return NextResponse.json({ error: "No account with that email" }, { status: 404 });
  }

  const entitlement = await db.entitlement.upsert({
    where: { userId_bankId: { userId: targetUser.id, bankId } },
    update: {},
    create: {
      userId: targetUser.id,
      bankId,
      source: "manual_grant",
      grantedByUserId: session.user.id,
    },
    include: { user: { select: { email: true, displayName: true } } },
  });

  return NextResponse.json({ entitlement }, { status: 201 });
}
