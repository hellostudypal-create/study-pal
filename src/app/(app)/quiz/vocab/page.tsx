"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { McqCard, type McqItem, type McqAnswerResult } from "@/components/quiz/McqCard";

export default function VocabQuizPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"config" | "loading" | "taking" | "error">("config");
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [items, setItems] = useState<McqItem[]>([]);
  const [index, setIndex] = useState(0);
  const [points, setPoints] = useState(0);

  async function startQuiz() {
    setPhase("loading");
    setError(null);
    const res = await fetch("/api/quiz/vocab", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count: 10 }),
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

  async function handleAnswered(result: McqAnswerResult) {
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

  if (phase === "config" || phase === "error") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Vocabulary Quiz</h1>
        <Card>
          <CardHeader>
            <CardTitle>Ready when you are</CardTitle>
            <CardDescription>
              Up to 10 words — words you got wrong before come back first.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && <p className="mb-3 text-sm text-destructive">{error}</p>}
            <Button onClick={startQuiz}>Start Quiz</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === "loading") {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  const item = items[index];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Vocabulary Quiz</h1>
        <span className="text-sm font-medium text-muted-foreground">{points} pts</span>
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
