"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface BankRow {
  id: string;
  kind: "exam" | "vocab";
  title: string;
  examCategory: string | null;
  standardExamQuestionCount: number | null;
  examTimeLimitMinutes: number | null;
  theme: string | null;
  isPublished: boolean;
  _count: { examQuestions: number; vocabWords: number; entitlements: number };
}

type Kind = "exam" | "vocab";

export default function ManageBanksPage() {
  const router = useRouter();
  const [banks, setBanks] = useState<BankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [kind, setKind] = useState<Kind>("exam");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/banks")
      .then((res) => res.json())
      .then((data) => setBanks(data.banks ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const examBanks = useMemo(() => banks.filter((b) => b.kind === "exam"), [banks]);
  const vocabBanks = useMemo(() => banks.filter((b) => b.kind === "vocab"), [banks]);

  const visible = useMemo(() => {
    const list = kind === "exam" ? examBanks : vocabBanks;
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((b) => {
      const subtitle = (kind === "exam" ? b.examCategory : b.theme) ?? "";
      return b.title.toLowerCase().includes(q) || subtitle.toLowerCase().includes(q);
    });
  }, [kind, examBanks, vocabBanks, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Banks</h1>
        <Link href="/manage/banks/new" className={buttonVariants()}>
          + New bank
        </Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setKind("exam")}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
              kind === "exam" ? "bg-card shadow-sm" : "text-muted-foreground"
            )}
          >
            Exam banks ({examBanks.length})
          </button>
          <button
            type="button"
            onClick={() => setKind("vocab")}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-semibold transition-colors",
              kind === "vocab" ? "bg-card shadow-sm" : "text-muted-foreground"
            )}
          >
            Vocabulary banks ({vocabBanks.length})
          </button>
        </div>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${kind === "exam" ? "exam" : "vocabulary"} banks…`}
          className="sm:w-72"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading…
        </div>
      ) : banks.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No banks yet — create one to start adding content for sale.
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No {kind === "exam" ? "exam" : "vocabulary"} banks match that search.
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">{kind === "exam" ? "Category" : "Theme"}</th>
                  <th className="px-4 py-3">Items</th>
                  {kind === "exam" && <th className="px-4 py-3">Exam mode</th>}
                  <th className="px-4 py-3">Access</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visible.map((bank) => {
                  const itemCount = kind === "exam" ? bank._count.examQuestions : bank._count.vocabWords;
                  return (
                    <tr
                      key={bank.id}
                      onClick={() => router.push(`/manage/banks/${bank.id}`)}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                    >
                      <td className="px-4 py-3 font-medium">
                        <Link href={`/manage/banks/${bank.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                          {bank.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {(kind === "exam" ? bank.examCategory : bank.theme) ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{itemCount}</td>
                      {kind === "exam" && (
                        <td className="px-4 py-3 text-muted-foreground">
                          {bank.standardExamQuestionCount ? (
                            `${bank.standardExamQuestionCount}Q / ${bank.examTimeLimitMinutes ?? "—"}m`
                          ) : (
                            <span className="text-xs">Practice only</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-muted-foreground">{bank._count.entitlements}</td>
                      <td className="px-4 py-3">
                        <Badge variant={bank.isPublished ? "default" : "outline"}>
                          {bank.isPublished ? "Published" : "Draft"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
