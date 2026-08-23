import { NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { loadExamQuestionForEdit } from "@/lib/authz";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "questions");

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, imageId } = await params;
  const question = await loadExamQuestionForEdit(userId, id);
  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const image = await db.questionImage.findUnique({ where: { id: imageId } });
  if (!image || image.examQuestionId !== id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.questionImage.delete({ where: { id: imageId } });
  await unlink(path.join(UPLOAD_ROOT, image.imagePath)).catch(() => {});

  return NextResponse.json({ ok: true });
}
