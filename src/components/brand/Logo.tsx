import { cn } from "@/lib/utils";

const ICON_PATH =
  "M87.787 36.736a20.05 20.05 0 0 0-14.263-5.912 20.05 20.05 0 0 0-14.264 5.912L36.034 59.962a12.59 12.59 0 0 1-8.962 3.707 12.55 12.55 0 0 1-8.952-3.717A12.53 12.53 0 0 1 14.404 51c0-3.378 1.314-6.56 3.716-8.962a12.58 12.58 0 0 1 8.952-3.707 12.58 12.58 0 0 1 8.962 3.707l5.463 5.464 4.961-.46.342-4.842-5.464-5.464a20.05 20.05 0 0 0-14.264-5.912 20.05 20.05 0 0 0-14.264 5.912C8.998 40.546 6.896 45.613 6.896 51s2.102 10.452 5.912 14.265a20.05 20.05 0 0 0 14.264 5.911 20.05 20.05 0 0 0 14.264-5.911l23.226-23.227a12.59 12.59 0 0 1 8.963-3.707c3.378 0 6.56 1.313 8.952 3.707 4.944 4.945 4.944 12.979 0 17.924a12.58 12.58 0 0 1-8.952 3.707 12.59 12.59 0 0 1-8.963-3.707L58.301 53.7l-.342 4.842-4.961.46-.045-.045v.001l6.308 6.307a20.05 20.05 0 0 0 14.264 5.911 20.05 20.05 0 0 0 14.263-5.911c7.862-7.866 7.862-20.665-.001-28.529";

/** The Study Pal infinity mark, alone. Renders in `currentColor`. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="3 28 95 46" fill="currentColor" aria-hidden="true" className={className}>
      <path d={ICON_PATH} />
    </svg>
  );
}

/** The infinity mark on its brand-gradient tile, ready to drop into a nav bar. */
export function LogoBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-gold",
        className
      )}
    >
      <LogoMark className="h-[60%] w-[60%]" />
    </span>
  );
}

/** Full lockup: mark + "Study Pal" wordmark. */
export function Logo({
  className,
  badgeClassName,
  textClassName,
}: {
  className?: string;
  badgeClassName?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <LogoBadge className={badgeClassName} />
      <span className={cn("text-lg font-extrabold tracking-tight", textClassName)}>Study Pal</span>
    </span>
  );
}
