import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { getEntitledBankIds } from "@/lib/authz";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 8;

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind");
  if (kind !== "exam" && kind !== "vocab") {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }

  const q = searchParams.get("q")?.trim() || undefined;
  const sort = searchParams.get("sort") ?? "title";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const bankIds = await getEntitledBankIds(userId, kind);
  const where: Prisma.BankWhereInput = {
    id: { in: bankIds },
    ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
  };

  const orderBy: Prisma.BankOrderByWithRelationInput =
    sort === "newest"
      ? { createdAt: "desc" }
      : sort === "count"
        ? kind === "exam"
          ? { examQuestions: { _count: "desc" } }
          : { vocabWords: { _count: "desc" } }
        : { title: "asc" };

  const [banks, total] = await Promise.all([
    db.bank.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { _count: { select: { examQuestions: true, vocabWords: true } } },
    }),
    db.bank.count({ where }),
  ]);

  return NextResponse.json({
    banks: banks.map((bank) => ({
      id: bank.id,
      title: bank.title,
      subtitle: bank.kind === "exam" ? bank.examCategory : bank.theme,
      count: bank.kind === "exam" ? bank._count.examQuestions : bank._count.vocabWords,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
