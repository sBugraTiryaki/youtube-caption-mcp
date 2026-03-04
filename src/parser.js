/**
 * Parses yt-dlp json3 subtitle format into plain text.
 * Handles both manual and auto-generated (word-level) subtitles.
 */
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

    lines.push(text);
  }

  return lines
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
