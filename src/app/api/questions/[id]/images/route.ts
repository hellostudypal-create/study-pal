import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { loadExamQuestionForEdit, loadExamQuestionForRead } from "@/lib/authz";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "questions");
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX_BYTES = 8 * 1024 * 1024; // 8MB per image

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const question = await loadExamQuestionForEdit(userId, id);
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  const file = form.get("file");
  const requestedRole = form.get("role") as string;
  const role =
    requestedRole === "option" || requestedRole === "answer" ? requestedRole : "question";
  const label = (form.get("label") as string) || null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WebP images are allowed" },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 8MB)" }, { status: 400 });
  }

  const questionDir = path.join(UPLOAD_ROOT, id);
  await mkdir(questionDir, { recursive: true });

  const filename = `${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(questionDir, filename), buffer);

  const count = await db.questionImage.count({ where: { examQuestionId: id } });

  const image = await db.questionImage.create({
    data: {
      examQuestionId: id,
      role,
      label,
      imagePath: `${id}/${filename}`,
      order: count,
    },
  });

  return NextResponse.json({ image }, { status: 201 });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const question = await loadExamQuestionForRead(userId, id);
  if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const images = await db.questionImage.findMany({
    where: { examQuestionId: id },
    orderBy: { order: "asc" },
  });

  return NextResponse.json({ images });
}
