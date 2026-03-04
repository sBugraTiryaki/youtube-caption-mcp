import { execFile } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function run(cmd, args, timeout = 30_000) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { timeout, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (err) {
        const msg = stderr?.trim() || err.message;
        reject(new Error(`yt-dlp failed: ${msg}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

let ytDlpChecked = false;

async function ensureYtDlp() {
  if (ytDlpChecked) return;
  try {
    await run("yt-dlp", ["--version"]);
    ytDlpChecked = true;
  } catch {
    throw new Error(
      "yt-dlp is not installed. Install it with: brew install yt-dlp (macOS) / pip install yt-dlp / winget install yt-dlp (Windows)"
    );
  }
}

export async function fetchTranscript(url, lang = "en") {
  await ensureYtDlp();

  const tmp = await mkdtemp(join(tmpdir(), "yt-transcript-"));
  const output = join(tmp, "sub");
  const filePath = `${output}.${lang}.json3`;

  try {
    // Try manual subs first
    await run("yt-dlp", [
      "--write-subs",
      "--sub-format", "json3",
      "--sub-langs", lang,
      "--skip-download",
      "-o", output,
      url,
    ]);

    // If manual subs weren't found (exit 0 but no file), try auto-generated
    if (!await fileExists(filePath)) {
      await run("yt-dlp", [
        "--write-auto-subs",
        "--sub-format", "json3",
        "--sub-langs", lang,
        "--skip-download",
        "-o", output,
        url,
      ]);
    }

    if (!await fileExists(filePath)) {
      throw new Error(`No subtitles found for language: ${lang}`);
    }

    return await readFile(filePath, "utf8");
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

export async function fetchMetadata(url) {
  await ensureYtDlp();

  const stdout = await run("yt-dlp", [
    "--dump-json",
    "--skip-download",
    url,
  ]);

  const data = JSON.parse(stdout);

  return {
    title: data.title,
    channel: data.channel,
    duration: data.duration_string,
    upload_date: data.upload_date,
    description: data.description,
    subtitles: {
      manual: Object.keys(data.subtitles ?? {}),
      auto_generated: Object.keys(data.automatic_captions ?? {}).length > 0,
    },
  };
}
