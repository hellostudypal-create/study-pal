import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertCanEditBank, getEntitledBankIds, getOrCreatePersonalBank } from "@/lib/authz";

const createSchema = z.object({
  term: z.string().min(1).max(200),
  definition: z.string().max(2000).optional(),
  definitionSi: z.string().max(2000).nullable().optional(),
  exampleSentence: z.string().max(2000).optional(),
  bookId: z.string().uuid().nullable().optional(),
  chapter: z.string().max(200).nullable().optional(),
  bankId: z.string().uuid().optional(),
});

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const bankId = searchParams.get("bankId")?.trim();

  const entitledBankIds = await getEntitledBankIds(userId, "vocab");
  const bankFilter = bankId && entitledBankIds.includes(bankId) ? [bankId] : entitledBankIds;

  const words = await db.vocabWord.findMany({
    where: {
      bankId: { in: bankFilter },
      ...(q
        ? {
            OR: [
              { term: { contains: q, mode: "insensitive" } },
              { definition: { contains: q, mode: "insensitive" } },
              { definitionSi: { contains: q, mode: "insensitive" } },
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

  const { bankId: requestedBankId, ...data } = parsed.data;
  const bankId = requestedBankId ?? (await getOrCreatePersonalBank(userId, "vocab")).id;

  const bank = await assertCanEditBank(userId, bankId);
  if (!bank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const word = await db.vocabWord.create({
    data: { ...data, bankId },
  });

  return NextResponse.json({ word }, { status: 201 });
}
