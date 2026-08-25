import Link from "next/link";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ManageBanksPage() {
  const banks = await db.bank.findMany({
    where: { isPersonal: false },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { examQuestions: true, vocabWords: true, entitlements: true } } },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Banks</h1>
        <Link href="/manage/banks/new" className={buttonVariants()}>
          + New bank
        </Link>
      </div>

      {banks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No banks yet — create one to start adding content for sale.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {banks.map((bank) => {
            const contentCount = bank.kind === "exam" ? bank._count.examQuestions : bank._count.vocabWords;
            return (
              <Link key={bank.id} href={`/manage/banks/${bank.id}`}>
                <Card className="transition-colors hover:border-primary/50">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{bank.title}</h3>
                        <Badge variant={bank.isPublished ? "default" : "outline"}>
                          {bank.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {bank.kind === "exam" ? bank.examCategory ?? "Exam" : bank.theme ?? "Vocabulary"}
                        {" · "}
                        {contentCount} items · {bank._count.entitlements} with access
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
