import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertCanEditBank } from "@/lib/authz";

const bodySchema = z.object({
  bankId: z.string().uuid(),
  items: z
    .array(
      z.object({
        term: z.string().min(1).max(200),
        definition: z.string().max(2000).optional(),
        definitionSi: z.string().max(2000).optional(),
        exampleSentence: z.string().max(2000).optional(),
        sourceBook: z.string().max(300).optional(),
        chapter: z.string().max(200).optional(),
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

  const bookIdByTitle = new Map<string, string>();
  for (const title of new Set(items.map((i) => i.sourceBook?.trim()).filter((t): t is string => !!t))) {
    const book =
      (await db.book.findFirst({ where: { title } })) ?? (await db.book.create({ data: { title } }));
    bookIdByTitle.set(title, book.id);
  }

  const result = await db.vocabWord.createMany({
    data: items.map(({ sourceBook, ...item }) => ({
      ...item,
      bankId,
      bookId: sourceBook?.trim() ? bookIdByTitle.get(sourceBook.trim()) : undefined,
    })),
  });

  return NextResponse.json({ created: result.count }, { status: 201 });
}
