const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const WATCH_URL = "https://www.youtube.com/watch?v=";

function extractVideoId(urlOrId) {
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;

  try {
    const url = new URL(urlOrId);
    if (url.hostname === "youtu.be") return url.pathname.slice(1);
    const v = url.searchParams.get("v");
    if (v) return v;
    const match = url.pathname.match(/\/(?:embed|v)\/([a-zA-Z0-9_-]{11})/);
    if (match) return match[1];
  } catch {}

  throw new Error(`Could not extract video ID from: ${urlOrId}`);
}

/**
 * Fetches the watch page HTML, extracts the INNERTUBE_API_KEY,
 * then POSTs to the Innertube player endpoint with ANDROID client
 * to get caption tracks without exp=xpe protection.
 */
async function fetchPlayerData(videoId) {
  // Step 1: Fetch watch page to get API key
  const pageRes = await fetch(WATCH_URL + videoId, {
    headers: { "User-Agent": USER_AGENT, "Accept-Language": "en-US,en;q=0.9" },
  });

  if (!pageRes.ok) {
    throw new Error(`Failed to fetch video page: ${pageRes.status}`);
  }

  const html = await pageRes.text();

  if (html.includes('class="g-recaptcha"')) {
    throw new Error("YouTube is rate limiting requests from this IP. Please try again later.");
  }

  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) {
    throw new Error("Could not extract YouTube API key from page");
  }

  // Step 2: POST to Innertube with ANDROID client
  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKeyMatch[1]}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
      body: JSON.stringify({
        context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
        videoId,
      }),
    }
  );

  if (!playerRes.ok) {
    throw new Error(`YouTube API returned ${playerRes.status}`);
  }

  const data = await playerRes.json();

  if (data.playabilityStatus?.status !== "OK") {
    const reason = data.playabilityStatus?.reason || "Video unavailable";
    throw new Error(reason);
  }

  return data;
}

export async function fetchTranscript(urlOrId, lang = "en") {
  const videoId = extractVideoId(urlOrId);
  const data = await fetchPlayerData(videoId);

  const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) {
    throw new Error("No captions available for this video");
  }

  // Prefer manual subs over auto-generated (kind === "asr")
  let track = tracks.find((t) => t.languageCode === lang && t.kind !== "asr");
  if (!track) track = tracks.find((t) => t.languageCode === lang);
  if (!track) {
    const available = tracks.map((t) => t.languageCode).join(", ");
    throw new Error(`No captions for language '${lang}'. Available: ${available}`);
  }

  // Strip fmt=srv3, add fmt=json3 for parser.js compatibility
  const captionUrl = track.baseUrl.replace(/&fmt=[^&]+/, "") + "&fmt=json3";
  const res = await fetch(captionUrl, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch captions: ${res.status}`);
  }

  return await res.text();
}

export async function fetchMetadata(urlOrId) {
  const videoId = extractVideoId(urlOrId);
  const data = await fetchPlayerData(videoId);
  const details = data.videoDetails ?? {};
  const tracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  const manual = [];
  const hasAuto = tracks.some((t) => t.kind === "asr");

  for (const t of tracks) {
    if (t.kind !== "asr") manual.push(t.languageCode);
  }

  return {
    title: details.title,
    channel: details.author,
    duration: formatDuration(Number(details.lengthSeconds || 0)),
    upload_date: null,
    description: details.shortDescription,
    subtitles: {
      manual,
      auto_generated: hasAuto,
    },
  };
}

function formatDuration(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
