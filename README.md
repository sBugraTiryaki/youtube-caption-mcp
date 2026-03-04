# youtube-caption-mcp

MCP server that extracts YouTube video captions with timestamps using yt-dlp. Prefers manual subtitles, falls back to auto-generated.

## Quick Start

### Install
```bash
claude mcp add youtube-caption -- npx -y youtube-caption-mcp
```

### Remove
```bash
claude mcp remove youtube-caption
```

## Prerequisite

- Node.js 18+
- [yt-dlp](https://github.com/yt-dlp/yt-dlp)

```bash
# macOS
brew install yt-dlp

# Windows
winget install yt-dlp

# Linux / pip
pip install yt-dlp
```

## Tools

### `get_transcript`
Extract captions from a YouTube video.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | yes | - | YouTube video URL or ID |
| `lang` | string | no | `"en"` | Language code (e.g., `"en"`, `"tr"`) |

Returns timestamped captions directly into Claude's context:
```
[0:00] Introduction
[0:15] First topic starts here
[1:02] Second topic begins
```

### `get_metadata`
Get video metadata including available subtitle languages.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | yes | YouTube video URL or ID |

Returns JSON with title, channel, duration, description, and available subtitle languages.

## How it Works

1. Uses yt-dlp to download subtitles in json3 format
2. Prefers manual subtitles, falls back to auto-generated
3. Parses json3 into timestamped text
4. Returns captions directly to Claude (no files saved to disk)

## License

MIT
