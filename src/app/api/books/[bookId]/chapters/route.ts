import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  subtitle: z.string().max(500).optional(),
  coverImageUrl: z.string().trim().url().max(1000).nullable().optional(),
  isFreePreview: z.boolean().default(false),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bookId } = await params;
  const book = await db.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const last = await db.bookChapter.findFirst({ where: { bookId }, orderBy: { order: "desc" } });
  const chapter = await db.bookChapter.create({
    data: { ...parsed.data, bookId, order: (last?.order ?? -1) + 1 },
  });

  return NextResponse.json({ chapter }, { status: 201 });
}
