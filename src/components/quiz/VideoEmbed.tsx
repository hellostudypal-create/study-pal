"use client";

import { PlayCircle } from "lucide-react";
import { getVideoEmbedInfo } from "@/lib/video";
import { useTranslation } from "@/lib/i18n/useTranslation";

export function VideoEmbed({ url }: { url: string }) {
  const { t } = useTranslation();
  const embed = getVideoEmbedInfo(url);

  if (embed.type === "youtube") {
    return (
      <div className="aspect-video overflow-hidden rounded-md border border-border bg-muted">
        <iframe
          src={embed.src}
          title={t("quizPlay.explanationVideoTitle")}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (embed.type === "video") {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return (
      <video controls className="w-full rounded-md border border-border bg-muted">
        <source src={embed.src} />
      </video>
    );
  }

  return (
    <a
      href={embed.src}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md border border-border bg-muted p-3 text-sm font-medium text-primary hover:underline"
    >
      <PlayCircle className="h-4 w-4" />
      {t("quizPlay.watchVideo")}
    </a>
  );
}
