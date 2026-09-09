"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const WARNING_THRESHOLD_SECONDS = 120;

function formatTime(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function ExamCountdownTimer({
  startedAt,
  timeLimitSeconds,
  onExpire,
}: {
  startedAt: string;
  timeLimitSeconds: number;
  onExpire: () => void;
}) {
  const deadline = useRef(new Date(startedAt).getTime() + timeLimitSeconds * 1000);
  const expired = useRef(false);
  const [remaining, setRemaining] = useState(() => Math.round((deadline.current - Date.now()) / 1000));

  useEffect(() => {
    const tick = () => {
      const secondsLeft = Math.round((deadline.current - Date.now()) / 1000);
      setRemaining(secondsLeft);
      if (secondsLeft <= 0 && !expired.current) {
        expired.current = true;
        onExpire();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isWarning = remaining <= WARNING_THRESHOLD_SECONDS;

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-sm font-bold tabular-nums",
        isWarning ? "bg-destructive-tint text-destructive animate-pulse" : "bg-primary-tint text-primary"
      )}
    >
      {formatTime(remaining)}
    </span>
  );
}
