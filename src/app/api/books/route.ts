import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().trim().url().max(1000).nullable().optional(),
  price: z.number().min(0).optional(),
  isPublished: z.boolean().default(false),
  quizBankId: z.string().uuid().nullable().optional(),
  previewPhraseLimit: z.number().int().min(0).max(100).default(5),
  speechEnabled: z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const books = await db.book.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { chapters: true, entitlements: true } } },
  });

  return NextResponse.json({ books });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
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

  const book = await db.book.create({ data: parsed.data });

  return NextResponse.json({ book }, { status: 201 });
}
