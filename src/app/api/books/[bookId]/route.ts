import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  author: z.string().max(200).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  coverImageUrl: z.string().trim().url().max(1000).nullable().optional(),
  price: z.number().min(0).nullable().optional(),
  isPublished: z.boolean().optional(),
  quizBankId: z.string().uuid().nullable().optional(),
  previewPhraseLimit: z.number().int().min(0).max(100).optional(),
  speechEnabled: z.boolean().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bookId } = await params;
  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ book });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bookId } = await params;
  const existing = await db.book.findUnique({ where: { id: bookId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  if (parsed.data.quizBankId) {
    const quizBank = await db.bank.findUnique({ where: { id: parsed.data.quizBankId }, select: { kind: true } });
    if (!quizBank || quizBank.kind !== "exam") {
      return NextResponse.json({ error: "Quiz bank must be an existing exam bank" }, { status: 400 });
    }
  }

  const book = await db.book.update({ where: { id: bookId }, data: parsed.data });

  return NextResponse.json({ book });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bookId } = await params;
  const existing = await db.book.findUnique({ where: { id: bookId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.book.delete({ where: { id: bookId } });

  return NextResponse.json({ ok: true });
}
