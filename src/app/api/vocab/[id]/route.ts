import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { loadVocabWordForEdit, loadVocabWordForRead } from "@/lib/authz";

const updateSchema = z.object({
  term: z.string().min(1).max(200).optional(),
  definition: z.string().max(2000).nullable().optional(),
  exampleSentence: z.string().max(2000).nullable().optional(),
  sourceBook: z.string().max(300).nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const word = await loadVocabWordForRead(userId, id);
  if (!word) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ word });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadVocabWordForEdit(userId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const word = await db.vocabWord.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ word });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const existing = await loadVocabWordForEdit(userId, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.vocabWord.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
