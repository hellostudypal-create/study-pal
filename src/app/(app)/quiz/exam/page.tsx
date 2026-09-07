"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { bankCardClassName, BankCardContent, type BankCardData } from "@/components/quiz/BankCard";
import { SelfGradeCard, type SelfGradeItem } from "@/components/quiz/SelfGradeCard";
import type { QuizAnswerResult } from "@/components/quiz/types";

function ExamQuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<"browse" | "loading" | "taking" | "error">("browse");
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [items, setItems] = useState<SelfGradeItem[]>([]);
  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);

  const [banks, setBanks] = useState<BankCardData[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("title");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const autoStarted = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [query, sort]);

  useEffect(() => {
    if (phase !== "browse" && phase !== "error") return;
    setBanksLoading(true);
    const params = new URLSearchParams({ kind: "exam", sort, page: String(page) });
    if (query) params.set("q", query);
    fetch(`/api/banks/mine?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setBanks(
          (data.banks ?? []).map((b: BankCardData) => ({
            ...b,
            countLabel: "questions",
          }))
        );
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, [query, sort, page, phase]);

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    const urlBankId = searchParams.get("bankId");
    if (urlBankId) startQuiz(urlBankId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startQuiz(bankId?: string) {
    setPhase("loading");
    setError(null);
    const res = await fetch("/api/quiz/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 10, bankId: bankId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not start quiz");
      setPhase("error");
      return;
    }
    setQuizId(data.quiz.id);
    setItems(data.items);
    setIndex(0);
    setPoints(0);
    setPhase("taking");
  }

  async function handleAnswered(result: QuizAnswerResult) {
    const item = items[index];
    const res = await fetch(`/api/quiz/${quizId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizItemId: item.quizItemId, ...result }),
    });
    const data = await res.json();
    if (res.ok) setPoints((p) => p + data.pointsAwarded);

    if (index + 1 >= items.length) {
      await fetch(`/api/quiz/${quizId}/complete`, { method: "POST" });
      router.push(`/quiz/${quizId}/results`);
    } else {
      setIndex((i) => i + 1);
    }
  }

  if (phase === "browse" || phase === "error") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Bank Quiz</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a bank to practice — reveal the answer, then mark yourself right or wrong.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search question banks…"
            className="flex-1"
          />
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="sm:w-48">
            <option value="title">Sort: Name (A–Z)</option>
            <option value="newest">Sort: Newest</option>
            <option value="count">Sort: Most questions</option>
          </Select>
          <Button variant="outline" onClick={() => startQuiz()}>
            Practice all banks
          </Button>
        </div>

        {banksLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading…
          </div>
        ) : banks.length === 0 ? (
          <p className="text-muted-foreground">No question banks match that search.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {banks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => startQuiz(bank.id)}
                  className={bankCardClassName}
                >
                  <BankCardContent bank={bank} icon={HelpCircle} gradient="from-gold-surface to-gold-surface-2" />
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        Loading…
      </div>
    );
  }

  const item = items[index];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Question Bank Quiz</h1>
        <span className="rounded-full bg-gold-tint px-3 py-1 text-sm font-bold text-gold-ink">{points} pts</span>
      </div>
      <SelfGradeCard
        key={item.quizItemId}
        item={item}
        index={index}
        total={items.length}
        onAnswered={handleAnswered}
      />
    </div>
  );
}

export default function ExamQuizPage() {
  return (
    <Suspense fallback={null}>
      <ExamQuizPageInner />
    </Suspense>
  );
}
