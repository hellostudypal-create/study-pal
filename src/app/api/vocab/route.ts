import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

const createSchema = z.object({
  term: z.string().min(1).max(200),
  definition: z.string().max(2000).optional(),
  exampleSentence: z.string().max(2000).optional(),
  sourceBook: z.string().max(300).optional(),
});

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  const words = await db.vocabWord.findMany({
    where: {
      userId,
      ...(q
        ? {
            OR: [
              { term: { contains: q, mode: "insensitive" } },
              { definition: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ words });
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

  const word = await db.vocabWord.create({
    data: { ...parsed.data, userId },
  });

  return NextResponse.json({ word }, { status: 201 });
}
