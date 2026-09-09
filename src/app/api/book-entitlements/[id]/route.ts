import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const entitlement = await db.bookEntitlement.findUnique({ where: { id } });
  if (!entitlement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.bookEntitlement.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
