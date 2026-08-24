import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertCanEditBank } from "@/lib/authz";

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

const bodySchema = z.object({
  bankId: z.string().uuid(),
  items: z
    .array(
      z.object({
        questionText: z.string().min(1).max(4000),
        answerText: z.string().min(1).max(4000),
        language: z.enum(["en", "si"]).default("en"),
        category: z.string().max(200).optional(),
        correctOptionLabel: z.string().max(10).optional(),
        options: optionsSchema.optional(),
      })
    )
    .min(1)
    .max(500),
});

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { bankId, items } = parsed.data;
  const bank = await assertCanEditBank(userId, bankId);
  if (!bank) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const created = await db.$transaction(
    items.map(({ options, ...item }) =>
      db.examQuestion.create({
        data: {
          ...item,
          bankId,
          options: options
            ? { create: options.map((o, order) => ({ ...o, order })) }
            : undefined,
        },
      })
    )
  );

  return NextResponse.json({ created: created.length }, { status: 201 });
}
