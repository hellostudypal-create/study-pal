"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Word {
  text: string;
  start: number;
  end: number;
}

function splitWords(text: string): Word[] {
  const words: Word[] = [];
  const re = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(text))) {
    words.push({ text: match[0], start: match.index, end: match.index + match[0].length });
  }
  return words;
}

export function SpeakablePhrase({ text, className }: { text: string; className?: string }) {
  const [supported, setSupported] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [activeWord, setActiveWord] = useState<number | null>(null);
  const words = useMemo(() => splitWords(text), [text]);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined") window.speechSynthesis.cancel();
    setSpeaking(false);
    setActiveWord(null);
  }, []);

  // Stop any in-flight speech if the card unmounts (e.g. navigating away mid-sentence).
  useEffect(() => stop, [stop]);

  function handleClick() {
    if (!supported) return;
    if (speaking) {
      stop();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.95;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      setActiveWord(null);
    };
    utterance.onerror = () => {
      setSpeaking(false);
      setActiveWord(null);
    };
    utterance.onboundary = (event) => {
      if (event.name && event.name !== "word") return;
      const idx = words.findIndex((w) => event.charIndex >= w.start && event.charIndex < w.end);
      if (idx >= 0) setActiveWord(idx);
    };
    window.speechSynthesis.speak(utterance);
  }

  if (!supported) {
    return <p className={className}>{text}</p>;
  }

  return (
    <div className="flex items-start gap-2">
      <span className="relative mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center">
        {speaking && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/30" />}
        <button
          type="button"
          onClick={handleClick}
          aria-label={speaking ? "Stop reading phrase aloud" : "Read phrase aloud"}
          title={speaking ? "Stop" : "Listen"}
          className={cn(
            "relative inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors",
            speaking
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-primary-tint hover:text-primary"
          )}
        >
          <Volume2 className="h-4 w-4" />
        </button>
      </span>
      <p className={className}>
        {words.map((w, i) => (
          <span key={i} className={cn(speaking && i === activeWord && "rounded bg-primary-tint text-primary")}>
            {w.text}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}
