import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getEntitledBankIds } from "@/lib/authz";

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  if (kind !== "exam" && kind !== "vocab") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const bankIds = await getEntitledBankIds(userId, kind);
  const banks = await db.bank.findMany({
    where: { id: { in: bankIds } },
    select: { id: true, title: true, isPersonal: true },
    orderBy: { title: "asc" },
  });

  return NextResponse.json({ banks });
}
