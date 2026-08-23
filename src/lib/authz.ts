import { Bank, BankKind, ExamQuestion, VocabWord } from "@prisma/client";
import { db } from "@/lib/db";

export async function getEntitledBankIds(userId: string, kind?: BankKind): Promise<string[]> {
  const entitlements = await db.entitlement.findMany({
    where: { userId, bank: kind ? { kind } : undefined },
    select: { bankId: true },
  });
  return entitlements.map((e) => e.bankId);
}

export async function assertEntitled(userId: string, bankId: string): Promise<Bank | null> {
  const entitlement = await db.entitlement.findUnique({
    where: { userId_bankId: { userId, bankId } },
    include: { bank: true },
  });
  return entitlement?.bank ?? null;
}

export async function canEditBank(userId: string, bankId: string): Promise<boolean> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user) return false;
  if (user.role === "admin") return true;

  const bank = await db.bank.findUnique({ where: { id: bankId }, select: { isPersonal: true, ownerUserId: true } });
  if (!bank) return false;
  if (bank.isPersonal && bank.ownerUserId === userId) return true;

  if (user.role === "content_editor") {
    const editor = await db.bankEditor.findUnique({ where: { userId_bankId: { userId, bankId } } });
    return editor !== null;
  }
  return false;
}

export async function assertCanEditBank(userId: string, bankId: string): Promise<Bank | null> {
  const allowed = await canEditBank(userId, bankId);
  if (!allowed) return null;
  return db.bank.findUnique({ where: { id: bankId } });
}

export async function loadExamQuestionForRead(userId: string, questionId: string): Promise<ExamQuestion | null> {
  const question = await db.examQuestion.findUnique({ where: { id: questionId } });
  if (!question) return null;
  const entitled = await assertEntitled(userId, question.bankId);
  return entitled ? question : null;
}

export async function loadExamQuestionForEdit(userId: string, questionId: string): Promise<ExamQuestion | null> {
  const question = await db.examQuestion.findUnique({ where: { id: questionId } });
  if (!question) return null;
  const allowed = await canEditBank(userId, question.bankId);
  return allowed ? question : null;
}

export async function loadVocabWordForRead(userId: string, wordId: string): Promise<VocabWord | null> {
  const word = await db.vocabWord.findUnique({ where: { id: wordId } });
  if (!word) return null;
  const entitled = await assertEntitled(userId, word.bankId);
  return entitled ? word : null;
}

export async function loadVocabWordForEdit(userId: string, wordId: string): Promise<VocabWord | null> {
  const word = await db.vocabWord.findUnique({ where: { id: wordId } });
  if (!word) return null;
  const allowed = await canEditBank(userId, word.bankId);
  return allowed ? word : null;
}

export async function getOrCreatePersonalBank(userId: string, kind: BankKind): Promise<Bank> {
  const existing = await db.bank.findFirst({ where: { ownerUserId: userId, kind, isPersonal: true } });
  if (existing) return existing;

  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { displayName: true, email: true } });
  const title = `${user.displayName ?? user.email}'s ${kind === "exam" ? "Questions" : "Vocabulary"}`;

  const bank = await db.bank.create({
    data: { kind, title, isPersonal: true, ownerUserId: userId },
  });
  await db.entitlement.create({
    data: { userId, bankId: bank.id, source: "personal" },
  });
  return bank;
}
