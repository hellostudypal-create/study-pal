import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(500).nullable().optional(),
  coverImageUrl: z.string().trim().url().max(1000).nullable().optional(),
  isFreePreview: z.boolean().optional(),
  order: z.number().int().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bookId, chapterId } = await params;
  const existing = await db.bookChapter.findUnique({ where: { id: chapterId } });
  if (!existing || existing.bookId !== bookId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const chapter = await db.bookChapter.update({ where: { id: chapterId }, data: parsed.data });

  return NextResponse.json({ chapter });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bookId, chapterId } = await params;
  const existing = await db.bookChapter.findUnique({ where: { id: chapterId } });
  if (!existing || existing.bookId !== bookId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.bookChapter.delete({ where: { id: chapterId } });

  return NextResponse.json({ ok: true });
}
