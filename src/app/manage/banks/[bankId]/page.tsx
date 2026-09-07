import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/auth";
import { assertCanEditBank } from "@/lib/authz";
import { BankForm } from "@/components/banks/BankForm";
import { EntitlementManager } from "@/components/banks/EntitlementManager";
import { BankContentList } from "@/components/banks/BankContentList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

const PAGE_SIZE = 20;

export default async function BankDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ bankId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { bankId } = await params;
  const { page: pageParam } = await searchParams;
  const userId = await getCurrentUserId();
  const bank = userId ? await assertCanEditBank(userId, bankId) : null;
  if (!bank) notFound();

  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [entitlements, contentTotal, contentItems] = await Promise.all([
    db.entitlement.findMany({
      where: { bankId },
      include: { user: { select: { email: true, displayName: true } } },
      orderBy: { grantedAt: "desc" },
    }),
    bank.kind === "exam"
      ? db.examQuestion.count({ where: { bankId } })
      : db.vocabWord.count({ where: { bankId } }),
    bank.kind === "exam"
      ? db.examQuestion.findMany({
          where: { bankId },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: { id: true, questionText: true, category: true },
        })
      : db.vocabWord.findMany({
          where: { bankId },
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * PAGE_SIZE,
          take: PAGE_SIZE,
          select: { id: true, term: true, definition: true },
        }),
  ]);

  const contentTotalPages = Math.max(1, Math.ceil(contentTotal / PAGE_SIZE));
  const addHref =
    bank.kind === "exam" ? `/questions/new?bankId=${bankId}` : `/vocab/new?bankId=${bankId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{bank.title}</h1>
        <Link
          href={`/manage/banks/${bankId}/import`}
          className={buttonVariants({ variant: "secondary" })}
        >
          Import content
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <BankForm
            initial={{
              id: bank.id,
              kind: bank.kind,
              title: bank.title,
              description: bank.description ?? "",
              examCategory: bank.examCategory ?? "IQ",
              theme: bank.theme ?? "",
              price: bank.price?.toString() ?? "",
              isPublished: bank.isPublished,
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Content ({contentTotal})</CardTitle>
          <Link href={addHref} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            + Add {bank.kind === "exam" ? "question" : "word"}
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <BankContentList
            kind={bank.kind}
            items={contentItems.map((item) =>
              "questionText" in item
                ? { id: item.id, title: item.questionText, subtitle: item.category }
                : { id: item.id, title: item.term, subtitle: item.definition }
            )}
          />
          {contentTotalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Link
                href={`/manage/banks/${bankId}?page=${page - 1}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: page <= 1 ? "pointer-events-none opacity-40" : "",
                })}
              >
                Previous
              </Link>
              <span className="text-sm text-muted-foreground">
                Page {page} of {contentTotalPages}
              </span>
              <Link
                href={`/manage/banks/${bankId}?page=${page + 1}`}
                className={buttonVariants({
                  variant: "outline",
                  size: "sm",
                  className: page >= contentTotalPages ? "pointer-events-none opacity-40" : "",
                })}
              >
                Next
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Who has access</CardTitle>
        </CardHeader>
        <CardContent>
          <EntitlementManager
            bankId={bankId}
            initialEntitlements={entitlements.map((e) => ({
              id: e.id,
              source: e.source,
              grantedAt: e.grantedAt.toISOString(),
              user: e.user,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
