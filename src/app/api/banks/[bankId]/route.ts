import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertCanEditBank } from "@/lib/authz";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  examCategory: z.enum(["IQ", "Grade5Scholarship", "OL", "AL", "GovAdmin", "Other"]).nullable().optional(),
  theme: z.string().max(200).nullable().optional(),
  price: z.number().min(0).nullable().optional(),
  isPublished: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bankId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bankId } = await params;
  const bank = await assertCanEditBank(userId, bankId);
  if (!bank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ bank });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bankId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bankId } = await params;
  const existing = await assertCanEditBank(userId, bankId);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const bank = await db.bank.update({
    where: { id: bankId },
    data: parsed.data,
  });

  return NextResponse.json({ bank });
}
