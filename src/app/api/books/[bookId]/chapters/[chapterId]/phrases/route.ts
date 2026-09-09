import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const createSchema = z.object({
  phrase: z.string().min(1).max(500),
  translationSi: z.string().max(1000).optional(),
  pronunciationSi: z.string().max(1000).optional(),
  explanation: z.string().min(1).max(4000),
  explanationSi: z.string().max(4000).optional(),
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const last = await db.bookPhrase.findFirst({ where: { chapterId }, orderBy: { order: "desc" } });
  const phrase = await db.bookPhrase.create({
    data: { ...parsed.data, chapterId, order: (last?.order ?? -1) + 1 },
  });

  return NextResponse.json({ phrase }, { status: 201 });
}
