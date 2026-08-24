import Link from "next/link";
import { BookOpen, HelpCircle } from "lucide-react";

export default function QuizHubPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Quiz</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/quiz/vocab"
          className="rounded-md bg-gradient-to-br from-primary-2 to-primary p-6 text-white transition-transform hover:scale-[1.02]"
        >
          <BookOpen className="h-6 w-6" />
          <p className="mt-3 text-lg font-bold">Vocabulary Quiz</p>
          <p className="mt-1 text-sm opacity-90">Words you got wrong before come back first.</p>
        </Link>
        <Link
          href="/quiz/exam"
          className="rounded-md bg-gradient-to-br from-gold-surface to-gold-surface-2 p-6 text-white transition-transform hover:scale-[1.02]"
        >
          <HelpCircle className="h-6 w-6" />
          <p className="mt-3 text-lg font-bold">Question Bank Quiz</p>
          <p className="mt-1 text-sm opacity-90">Reveal the answer, then mark yourself right or wrong.</p>
        </Link>
      </div>
    </div>
  );
}
