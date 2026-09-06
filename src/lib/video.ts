export type VideoEmbedInfo =
  | { type: "youtube"; src: string }
  | { type: "video"; src: string }
  | { type: "link"; src: string };

export function getVideoEmbedInfo(url: string): VideoEmbedInfo {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "").replace(/^m\./, "");

    if (host === "youtube.com") {
      const id = u.searchParams.get("v");
      if (id) return { type: "youtube", src: `https://www.youtube.com/embed/${id}` };
      const shorts = u.pathname.match(/^\/shorts\/([^/?]+)/);
      if (shorts) return { type: "youtube", src: `https://www.youtube.com/embed/${shorts[1]}` };
      const embed = u.pathname.match(/^\/embed\/([^/?]+)/);
      if (embed) return { type: "youtube", src: url };
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1);
      if (id) return { type: "youtube", src: `https://www.youtube.com/embed/${id}` };
    }
    if (/\.(mp4|webm|ogg)$/i.test(u.pathname)) {
      return { type: "video", src: url };
    }
  } catch {
    // not a parseable URL — fall through to a plain link
  }
  return { type: "link", src: url };
}
