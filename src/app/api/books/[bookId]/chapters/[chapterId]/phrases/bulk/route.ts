import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        phrase: z.string().min(1).max(500),
        translationSi: z.string().max(1000).optional(),
        pronunciationSi: z.string().max(1000).optional(),
        explanation: z.string().min(1).max(4000),
        explanationSi: z.string().max(4000).optional(),
      })
    )
    .min(1)
    .max(500),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ bookId: string; chapterId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bookId, chapterId } = await params;
  const chapter = await db.bookChapter.findUnique({ where: { id: chapterId } });
  if (!chapter || chapter.bookId !== bookId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const last = await db.bookPhrase.findFirst({ where: { chapterId }, orderBy: { order: "desc" } });
  const startOrder = (last?.order ?? -1) + 1;

  const result = await db.bookPhrase.createMany({
    data: parsed.data.items.map((item, i) => ({ ...item, chapterId, order: startOrder + i })),
  });

  return NextResponse.json({ created: result.count }, { status: 201 });
}
