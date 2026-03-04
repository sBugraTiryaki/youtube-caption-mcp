# youtube-transcript-mcp

MCP server that extracts YouTube video transcripts using yt-dlp. Prefers manual subtitles, falls back to auto-generated.

## Quick Start

### Install
```bash
claude mcp add youtube-transcript -- npx -y youtube-transcript-mcp
```

### Remove
```bash
claude mcp remove youtube-transcript
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
Extract transcript from a YouTube video.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `url` | string | yes | - | YouTube video URL or ID |
| `lang` | string | no | `"en"` | Language code (e.g., `"en"`, `"tr"`) |

Returns plain text transcript directly into Claude's context.

### `get_metadata`
Get video metadata including available subtitle languages.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | yes | YouTube video URL or ID |

Returns JSON with title, channel, duration, description, and available subtitle languages.

## How it Works

1. Uses yt-dlp to download subtitles in json3 format
2. Prefers manual subtitles, falls back to auto-generated
3. Parses json3 into plain text
4. Returns transcript directly to Claude (no files saved to disk)

## License

MIT
