/**
 * Parses yt-dlp json3 subtitle format into timestamped text.
 * Handles both manual and auto-generated (word-level) subtitles.
 */

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function parseJson3(json3) {
  const data = typeof json3 === "string" ? JSON.parse(json3) : json3;
  const events = data.events ?? [];

  const lines = [];

  for (const event of events) {
    if (!event.segs) continue;

    const text = event.segs
      .map((s) => s.utf8 ?? "")
      .join("")
      .trim();

    if (!text || text === "\n") continue;

    lines.push(`[${formatTime(event.tStartMs)}] ${text}`);
  }

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
