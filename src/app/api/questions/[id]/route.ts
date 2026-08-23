import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";

const updateSchema = z.object({
  questionText: z.string().min(1).max(4000).optional(),
  answerText: z.string().min(1).max(4000).optional(),
  language: z.enum(["en", "si"]).optional(),
  category: z.string().max(200).nullable().optional(),
  correctOptionLabel: z.string().max(10).nullable().optional(),
});

async function loadOwnedQuestion(userId: string, id: string) {
  const question = await db.examQuestion.findUnique({ where: { id } });
  if (!question || question.userId !== userId) return null;
  return question;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const question = await loadOwnedQuestion(userId, id);
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ question });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedQuestion(userId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const question = await db.examQuestion.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ question });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadOwnedQuestion(userId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.examQuestion.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
