import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const updateSchema = z.object({
  phrase: z.string().min(1).max(500).optional(),
  translationSi: z.string().max(1000).nullable().optional(),
  pronunciationSi: z.string().max(1000).nullable().optional(),
  explanation: z.string().min(1).max(4000).optional(),
  explanationSi: z.string().max(4000).nullable().optional(),
  order: z.number().int().optional(),
  markReviewed: z.boolean().optional(),
});

const CONTENT_KEYS = ["phrase", "translationSi", "pronunciationSi", "explanation", "explanationSi"] as const;

const reviewerSelect = { reviewedBy: { select: { displayName: true, email: true } } } as const;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ bookId: string; chapterId: string; phraseId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { chapterId, phraseId } = await params;
  const existing = await db.bookPhrase.findUnique({ where: { id: phraseId } });
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { markReviewed, ...content } = parsed.data;
  const contentChanged = CONTENT_KEYS.some(
    (key) => content[key] !== undefined && content[key] !== existing[key]
  );

  const data: typeof content & {
    isReviewed?: boolean;
    reviewedAt?: Date | null;
    reviewedByUserId?: string | null;
  } = { ...content };

  if (markReviewed !== undefined) {
    data.isReviewed = markReviewed;
    data.reviewedAt = markReviewed ? new Date() : null;
    data.reviewedByUserId = markReviewed ? session.user.id : null;
  } else if (contentChanged) {
    data.isReviewed = false;
    data.reviewedAt = null;
    data.reviewedByUserId = null;
  }

  const phrase = await db.bookPhrase.update({
    where: { id: phraseId },
    data,
    include: reviewerSelect,
  });

  return NextResponse.json({ phrase });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ bookId: string; chapterId: string; phraseId: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { chapterId, phraseId } = await params;
  const existing = await db.bookPhrase.findUnique({ where: { id: phraseId } });
  if (!existing || existing.chapterId !== chapterId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.bookPhrase.delete({ where: { id: phraseId } });

  return NextResponse.json({ ok: true });
}
