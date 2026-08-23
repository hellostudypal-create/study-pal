import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

const createSchema = z.object({
  questionText: z.string().min(1).max(4000),
  answerText: z.string().min(1).max(4000),
  language: z.enum(["en", "si"]).default("en"),
  category: z.string().max(200).optional(),
  correctOptionLabel: z.string().max(10).optional(),
});

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const language = searchParams.get("language");
  const category = searchParams.get("category")?.trim();

  const questions = await db.examQuestion.findMany({
    where: {
      userId,
      ...(language === "en" || language === "si" ? { language } : {}),
      ...(category ? { category } : {}),
      ...(q
        ? {
            OR: [
              { questionText: { contains: q, mode: "insensitive" } },
              { answerText: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ questions });
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const question = await db.examQuestion.create({
    data: { ...parsed.data, userId },
  });

  return NextResponse.json({ question }, { status: 201 });
}
