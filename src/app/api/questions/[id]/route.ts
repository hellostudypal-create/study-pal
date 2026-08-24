import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { loadExamQuestionForEdit, loadExamQuestionForRead } from "@/lib/authz";

const optionsSchema = z
  .array(
    z.object({
      label: z.enum(["A", "B", "C", "D"]),
      text: z.string().min(1).max(500),
      isCorrect: z.boolean(),
    })
  )
  .length(4)
  .refine((opts) => opts.filter((o) => o.isCorrect).length === 1, {
    message: "Exactly one option must be marked correct",
  });

const updateSchema = z.object({
  questionText: z.string().min(1).max(4000).optional(),
  answerText: z.string().min(1).max(4000).optional(),
  language: z.enum(["en", "si"]).optional(),
  category: z.string().max(200).nullable().optional(),
  correctOptionLabel: z.string().max(10).nullable().optional(),
  options: optionsSchema.nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const question = await loadExamQuestionForRead(userId, id);
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const options = await db.examQuestionOption.findMany({
    where: { examQuestionId: id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ question: { ...question, options } });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadExamQuestionForEdit(userId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { options, ...data } = parsed.data;

  const question = await db.$transaction(async (tx) => {
    if (options !== undefined) {
      await tx.examQuestionOption.deleteMany({ where: { examQuestionId: id } });
      if (options) {
        await tx.examQuestionOption.createMany({
          data: options.map((o, order) => ({ ...o, order, examQuestionId: id })),
        });
      }
    }
    return tx.examQuestion.update({ where: { id }, data });
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
  const existing = await loadExamQuestionForEdit(userId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.examQuestion.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
