"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { bankCardClassName, BankCardContent, type BankCardData } from "@/components/quiz/BankCard";
import { McqCard, type McqItem } from "@/components/quiz/McqCard";
import type { QuizAnswerResult } from "@/components/quiz/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

const PRACTICE_COUNT_OPTIONS = [10, 20, 50, 100];

function VocabQuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"browse" | "loading" | "taking" | "error">("browse");
  const [error, setError] = useState<string | null>(null);
  const [practiceCount, setPracticeCount] = useState(10);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [items, setItems] = useState<McqItem[]>([]);
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
    const params = new URLSearchParams({ kind: "vocab", sort, page: String(page) });
    if (query) params.set("q", query);
    fetch(`/api/banks/mine?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setBanks(
          (data.banks ?? []).map((b: BankCardData) => ({
            ...b,
            countLabel: t("quiz.wordsCount"),
          }))
        );
        setTotalPages(data.totalPages ?? 1);
      })
      .catch(() => {})
      .finally(() => setBanksLoading(false));
  }, [query, sort, page, phase, t]);

  useEffect(() => {
    if (autoStarted.current) return;
    autoStarted.current = true;
    const urlBankId = searchParams?.get("bankId");
    if (!urlBankId) return;
    const urlCount = Number(searchParams?.get("count"));
    if (urlCount > 0) setPracticeCount(urlCount);
    startQuiz(urlBankId, urlCount > 0 ? urlCount : undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startQuiz(bankId?: string, countOverride?: number) {
    setPhase("loading");
    setError(null);
    const res = await fetch("/api/quiz/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: countOverride ?? practiceCount, bankId: bankId || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t("quiz.couldNotStartQuiz"));
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
          <h1 className="text-2xl font-bold tracking-tight">{t("quiz.vocabQuiz")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("quiz.vocabQuizSubtitle")}</p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("quiz.searchVocabSets")}
            className="flex-1"
          />
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="sm:w-48">
            <option value="title">{t("quiz.sortNameAZ")}</option>
            <option value="newest">{t("quiz.sortNewest")}</option>
            <option value="count">{t("quiz.sortMostWords")}</option>
          </Select>
          <Select
            value={String(practiceCount)}
            onChange={(e) => setPracticeCount(Number(e.target.value))}
            className="sm:w-40"
          >
            {PRACTICE_COUNT_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {t("quiz.wordCountOption", { count: n })}
              </option>
            ))}
          </Select>
          <Button variant="outline" onClick={() => startQuiz()}>
            {t("quiz.practiceAllSets")}
          </Button>
        </div>

        {banksLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("common.loading")}
          </div>
        ) : banks.length === 0 ? (
          <p className="text-muted-foreground">{t("quiz.noVocabSetsMatch")}</p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {banks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => startQuiz(bank.id)}
                  className={bankCardClassName}
                >
                  <BankCardContent bank={bank} icon={BookOpen} accentClassName="bg-brand" />
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
                  {t("common.previous")}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {t("common.pageOf", { page, total: totalPages })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("common.next")}
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
        {t("common.loading")}
      </div>
    );
  }

  const item = items[index];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("quiz.vocabQuiz")}</h1>
          {item.bookTitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {item.chapter
                ? t("vocab.fromChapter", { book: item.bookTitle, chapter: item.chapter })
                : t("vocab.from", { book: item.bookTitle })}
            </p>
          )}
        </div>
        <span className="rounded-full bg-gold-tint px-3 py-1 text-sm font-bold text-gold-ink">
          {points} {t("quiz.pointsSuffix")}
        </span>
      </div>
      <McqCard
        key={item.quizItemId}
        item={item}
        index={index}
        total={items.length}
        onAnswered={handleAnswered}
      />
    </div>
  );
}

export default function VocabQuizPage() {
  return (
    <Suspense fallback={null}>
      <VocabQuizPageInner />
    </Suspense>
  );
}
