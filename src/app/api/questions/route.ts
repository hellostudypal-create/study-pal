import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertCanEditBank, getEntitledBankIds, getOrCreatePersonalBank } from "@/lib/authz";

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

const createSchema = z.object({
  questionText: z.string().min(1).max(4000),
  answerText: z.string().min(1).max(4000),
  language: z.enum(["en", "si"]).default("en"),
  category: z.string().max(200).optional(),
  correctOptionLabel: z.string().max(10).optional(),
  bankId: z.string().uuid().optional(),
  options: optionsSchema.optional(),
});

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const language = searchParams.get("language");
  const category = searchParams.get("category")?.trim();
  const bankId = searchParams.get("bankId")?.trim();

  const entitledBankIds = await getEntitledBankIds(userId, "exam");
  const bankFilter = bankId && entitledBankIds.includes(bankId) ? [bankId] : entitledBankIds;

  const questions = await db.examQuestion.findMany({
    where: {
      bankId: { in: bankFilter },
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

  const { bankId: requestedBankId, options, ...data } = parsed.data;
  const bankId = requestedBankId ?? (await getOrCreatePersonalBank(userId, "exam")).id;

  const bank = await assertCanEditBank(userId, bankId);
  if (!bank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const question = await db.examQuestion.create({
    data: {
      ...data,
      bankId,
      options: options
        ? { create: options.map((o, order) => ({ ...o, order })) }
        : undefined,
    },
    include: { options: true },
  });

  return NextResponse.json({ question }, { status: 201 });
}
