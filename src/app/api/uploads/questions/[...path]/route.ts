import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertEntitled } from "@/lib/authz";

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "questions");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { path: segments } = await params;
  if (segments.length !== 2) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [questionId, filename] = segments;

  // Prevent path traversal — filename must be a bare name, no separators.
  if (filename.includes("/") || filename.includes("..") || questionId.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const question = await db.examQuestion.findUnique({ where: { id: questionId } });
  if (!question) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const entitled = await assertEntitled(userId, question.bankId);
  if (!entitled) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const data = await readFile(path.join(UPLOAD_ROOT, questionId, filename));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
