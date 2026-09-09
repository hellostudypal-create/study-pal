import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

const createSchema = z.object({
  kind: z.enum(["exam", "vocab"]),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  coverImageUrl: z.string().trim().url().max(1000).nullable().optional(),
  examCategory: z.enum(["IQ", "Grade5Scholarship", "OL", "AL", "GovAdmin", "Other"]).optional(),
  standardExamQuestionCount: z.number().int().min(1).max(500).nullable().optional(),
  examTimeLimitMinutes: z.number().int().min(1).max(600).nullable().optional(),
  theme: z.string().max(200).optional(),
  price: z.number().min(0).optional(),
  isPublished: z.boolean().default(false),
});

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const banks = await db.bank.findMany({
    where: { isPersonal: false },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { examQuestions: true, vocabWords: true, entitlements: true } } },
  });

  return NextResponse.json({ banks });
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

  const bank = await db.bank.create({
    data: { ...parsed.data, ownerUserId: session.user.id },
  });

  return NextResponse.json({ bank }, { status: 201 });
}
