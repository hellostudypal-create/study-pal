"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { HelpCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { bankCardClassName, BankCardContent, type BankCardData } from "@/components/quiz/BankCard";
import { SelfGradeCard, type SelfGradeItem } from "@/components/quiz/SelfGradeCard";
import { ExamQuestionCard } from "@/components/quiz/ExamQuestionCard";
import { ExamCountdownTimer } from "@/components/quiz/ExamCountdownTimer";
import { QuestionNavBar } from "@/components/quiz/QuestionNavBar";
import { QuestionReviewRow } from "@/components/quiz/QuestionReviewRow";
import type { QuizAnswerResult } from "@/components/quiz/types";
import { useTranslation } from "@/lib/i18n/useTranslation";

type Phase = "browse" | "sets" | "loading" | "taking" | "error";
type SessionMode = "practice" | "exam";

interface ExamSet {
  index: number;
  questionCount: number;
  timeLimitMinutes: number | null;
  lastAttempt: { completedAt: string; correctCount: number; totalQuestions: number; pointsEarned: number } | null;
}

interface DraftAnswer {
  selectedAnswer?: string;
  wasCorrect?: boolean;
}

const PRACTICE_COUNT_OPTIONS = [10, 20, 50, 100];

function ExamQuizPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [phase, setPhase] = useState<Phase>("browse");
  const [error, setError] = useState<string | null>(null);
  const [tabMode, setTabMode] = useState<SessionMode>("practice");
  const [practiceCount, setPracticeCount] = useState(10);

  const [quizId, setQuizId] = useState<string | null>(null);
  const [sessionMode, setSessionMode] = useState<SessionMode>("practice");
  const [activeBankTitle, setActiveBankTitle] = useState<string | null>(null);
  const [activeSetIndex, setActiveSetIndex] = useState<number | null>(null);
  const [items, setItems] = useState<SelfGradeItem[]>([]);
  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);
  const [answeredUpTo, setAnsweredUpTo] = useState(0);
  const [answers, setAnswers] = useState<Record<string, DraftAnswer>>({});
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const submittedRef = useRef(false);

  const [setsBank, setSetsBank] = useState<{ id: string; title: string } | null>(null);
  const [sets, setSets] = useState<ExamSet[]>([]);
  const [setsLoading, setSetsLoading] = useState(false);

  const [banks, setBanks] = useState<BankCardData[]>([]);
  const [banksLoading, setBanksLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("title");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const autoStarted = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(timer);
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
            countLabel: t("quiz.questionsCount"),
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
    const urlBankId = searchParams.get("bankId");
    if (!urlBankId) return;
    if (searchParams.get("mode") === "exam") {
      setTabMode("exam");
      openExamSets(urlBankId);
    } else {
      const urlCount = Number(searchParams.get("count"));
      if (urlCount > 0) setPracticeCount(urlCount);
      startPracticeQuiz(urlBankId, urlCount > 0 ? urlCount : undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetQuizState() {
    setQuizId(null);
    setActiveBankTitle(null);
    setActiveSetIndex(null);
    setItems([]);
    setIndex(0);
    setPoints(0);
    setAnsweredUpTo(0);
    setAnswers({});
    setStartedAt(null);
    setTimeLimitSeconds(null);
    setSubmitting(false);
    submittedRef.current = false;
  }

  async function startPracticeQuiz(bankId?: string, countOverride?: number) {
    setPhase("loading");
    setError(null);
    resetQuizState();
    const res = await fetch("/api/quiz/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count: countOverride ?? practiceCount,
        bankId: bankId || undefined,
        sessionMode: "practice",
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t("quiz.couldNotStartQuiz"));
      setPhase("error");
      return;
    }
    setQuizId(data.quiz.id);
    setSessionMode("practice");
    setActiveBankTitle(data.quiz.bankTitle ?? null);
    setItems(data.items);
    setPhase("taking");
  }

  async function openExamSets(bankId: string, title?: string) {
    setSetsBank({ id: bankId, title: title ?? "" });
    setSets([]);
    setPhase("sets");
    setSetsLoading(true);
    fetch(`/api/banks/${bankId}/exam-sets`)
      .then((res) => res.json())
      .then((data) => {
        setSets(data.sets ?? []);
        if (data.bankTitle) setSetsBank({ id: bankId, title: data.bankTitle });
      })
      .catch(() => setSets([]))
      .finally(() => setSetsLoading(false));
  }

  async function startExamSet(setIndex: number) {
    if (!setsBank) return;
    setPhase("loading");
    setError(null);
    resetQuizState();
    const res = await fetch("/api/quiz/exam", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankId: setsBank.id, sessionMode: "exam", setIndex }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t("quiz.couldNotStartQuiz"));
      setPhase("error");
      return;
    }
    setQuizId(data.quiz.id);
    setSessionMode("exam");
    setActiveBankTitle(data.quiz.bankTitle ?? setsBank.title ?? null);
    setActiveSetIndex(data.quiz.setIndex ?? null);
    setItems(data.items);
    setStartedAt(data.quiz.startedAt);
    setTimeLimitSeconds(data.quiz.timeLimitSeconds ?? null);
    setPhase("taking");
  }

  async function handlePracticeAnswered(result: QuizAnswerResult) {
    const item = items[index];
    const res = await fetch(`/api/quiz/${quizId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizItemId: item.quizItemId, ...result }),
    });
    const data = await res.json();
    const wasCorrect = result.kind === "verified_choice" ? result.selectedAnswer === item.correctAnswer : result.wasCorrect;
    if (res.ok) {
      setPoints((p) => p + data.pointsAwarded);
      setAnswers((a) => ({
        ...a,
        [item.quizItemId]: {
          selectedAnswer: result.kind === "verified_choice" ? result.selectedAnswer : undefined,
          wasCorrect,
        },
      }));
    }

    const nextAnsweredUpTo = index + 1;
    setAnsweredUpTo(nextAnsweredUpTo);
    if (nextAnsweredUpTo >= items.length) {
      await fetch(`/api/quiz/${quizId}/complete`, { method: "POST" });
      router.push(`/quiz/${quizId}/results`);
    } else {
      setIndex(nextAnsweredUpTo);
    }
  }

  function handleExamSelect(optionText: string) {
    const item = items[index];
    setAnswers((a) => ({ ...a, [item.quizItemId]: { selectedAnswer: optionText } }));
    fetch(`/api/quiz/${quizId}/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quizItemId: item.quizItemId, kind: "verified_choice", selectedAnswer: optionText }),
    }).catch(() => {});
  }

  async function handleSubmitExam(auto = false) {
    if (submittedRef.current) return;
    const unansweredCount = items.filter((it) => !answers[it.quizItemId]?.selectedAnswer).length;
    if (!auto && unansweredCount > 0) {
      const proceed = window.confirm(t("quizPlay.unansweredConfirm", { count: unansweredCount }));
      if (!proceed) return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    await fetch(`/api/quiz/${quizId}/complete`, { method: "POST" });
    router.push(`/quiz/${quizId}/results`);
  }

  if (phase === "browse" || phase === "error") {
    const showExamTab = tabMode === "exam";
    const visibleBanks = showExamTab ? banks.filter((b) => b.standardExamQuestionCount) : banks;

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("quiz.examQuiz")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("quiz.examQuizSubtitle")}</p>
        </div>

        <div className="inline-flex rounded-lg border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setTabMode("practice")}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              tabMode === "practice" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t("quiz.practiceModeTab")}
          </button>
          <button
            type="button"
            onClick={() => setTabMode("exam")}
            className={`rounded-md px-4 py-1.5 text-sm font-semibold transition-colors ${
              tabMode === "exam" ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t("quiz.examModeTab")}
          </button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t("quiz.searchQuestionBanks")}
            className="flex-1"
          />
          <Select value={sort} onChange={(e) => setSort(e.target.value)} className="sm:w-48">
            <option value="title">{t("quiz.sortNameAZ")}</option>
            <option value="newest">{t("quiz.sortNewest")}</option>
            <option value="count">{t("quiz.sortMostQuestions")}</option>
          </Select>
          {!showExamTab && (
            <>
              <Select
                value={String(practiceCount)}
                onChange={(e) => setPracticeCount(Number(e.target.value))}
                className="sm:w-40"
              >
                {PRACTICE_COUNT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {t("quiz.questionCountOption", { count: n })}
                  </option>
                ))}
              </Select>
              <Button variant="outline" onClick={() => startPracticeQuiz()}>
                {t("quiz.practiceAllBanks")}
              </Button>
            </>
          )}
        </div>

        {banksLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("common.loading")}
          </div>
        ) : visibleBanks.length === 0 ? (
          <p className="text-muted-foreground">
            {showExamTab ? t("quiz.noExamModeBanks") : t("quiz.noQuestionBanksMatch")}
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {visibleBanks.map((bank) => (
                <button
                  key={bank.id}
                  type="button"
                  onClick={() => (showExamTab ? openExamSets(bank.id, bank.title) : startPracticeQuiz(bank.id))}
                  className={bankCardClassName}
                >
                  <BankCardContent bank={bank} icon={HelpCircle} accentClassName="bg-brand-2" />
                </button>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  {t("common.previous")}
                </Button>
                <span className="text-sm text-muted-foreground">{t("common.pageOf", { page, total: totalPages })}</span>
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

  if (phase === "sets") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{setsBank?.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t("quiz.examSetsSubtitle")}</p>
          </div>
          <Button variant="outline" onClick={() => setPhase("browse")}>
            {t("common.previous")}
          </Button>
        </div>

        {setsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {t("common.loading")}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((set) => (
              <button
                key={set.index}
                type="button"
                onClick={() => startExamSet(set.index)}
                className={`${bankCardClassName} p-4 text-left`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold">{t("quiz.setLabel", { index: set.index })}</h3>
                  {set.lastAttempt && <CheckCircle2 className="h-5 w-5 text-success" />}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("quiz.setMeta", { count: set.questionCount, minutes: set.timeLimitMinutes ?? 0 })}
                </p>
                {set.lastAttempt ? (
                  <p className="mt-2 text-sm font-semibold text-success">
                    {t("quiz.setLastScore", {
                      correct: set.lastAttempt.correctCount,
                      total: set.lastAttempt.totalQuestions,
                    })}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">{t("quiz.setNotAttempted")}</p>
                )}
              </button>
            ))}
          </div>
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
  const answeredFlags = items.map((it) => !!answers[it.quizItemId]?.selectedAnswer || answers[it.quizItemId]?.wasCorrect !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("quiz.examQuiz")}</h1>
          {activeBankTitle && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {activeSetIndex ? t("quiz.bankSetSubtitle", { bank: activeBankTitle, index: activeSetIndex }) : activeBankTitle}
            </p>
          )}
        </div>
        {sessionMode === "exam" ? (
          startedAt &&
          timeLimitSeconds && (
            <ExamCountdownTimer
              startedAt={startedAt}
              timeLimitSeconds={timeLimitSeconds}
              onExpire={() => handleSubmitExam(true)}
            />
          )
        ) : (
          <span className="rounded-full bg-gold-tint px-3 py-1 text-sm font-bold text-gold-ink">
            {points} {t("quiz.pointsSuffix")}
          </span>
        )}
      </div>

      {sessionMode === "exam" ? (
        <>
          <ExamQuestionCard
            key={item.quizItemId}
            item={item}
            index={index}
            total={items.length}
            selected={answers[item.quizItemId]?.selectedAnswer ?? null}
            onSelect={handleExamSelect}
          />
          <QuestionNavBar
            total={items.length}
            index={index}
            answered={answeredFlags}
            maxIndex={items.length - 1}
            onJump={setIndex}
            onPrev={() => setIndex((i) => Math.max(0, i - 1))}
            onNext={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            onSubmit={() => handleSubmitExam(false)}
            submitting={submitting}
          />
        </>
      ) : (
        <>
          {index < answeredUpTo ? (
            <QuestionReviewRow
              item={{
                questionText: item.questionText,
                language: item.language,
                images: item.images,
                options: item.options,
                selectedAnswer: answers[item.quizItemId]?.selectedAnswer ?? null,
                correctAnswer: item.correctAnswer,
                correctOptionLabel: item.correctOptionLabel,
                answerText: item.answerText,
                explanationVideoUrl: item.explanationVideoUrl,
              }}
              index={index}
              total={items.length}
            />
          ) : (
            <SelfGradeCard
              key={item.quizItemId}
              item={item}
              index={index}
              total={items.length}
              onAnswered={handlePracticeAnswered}
            />
          )}
          {answeredUpTo > 0 && (
            <QuestionNavBar
              total={items.length}
              index={index}
              answered={answeredFlags}
              maxIndex={answeredUpTo}
              onJump={setIndex}
              onPrev={() => setIndex((i) => Math.max(0, i - 1))}
              onNext={() => setIndex((i) => Math.min(answeredUpTo, i + 1))}
              showJumpGrid={false}
            />
          )}
        </>
      )}
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
