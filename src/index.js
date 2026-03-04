#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { fetchTranscript, fetchMetadata } from "./yt-dlp.js";
import { parseJson3 } from "./parser.js";

const server = new Server(
  { name: "youtube-transcript", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "get_transcript",
      description:
        "Extract transcript from a YouTube video URL or ID",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "YouTube video URL or ID",
          },
          lang: {
            type: "string",
            description: "Language code (e.g., 'en', 'tr')",
            default: "en",
          },
        },
        required: ["url"],
      },
    },
    {
      name: "get_metadata",
      description:
        "Get YouTube video metadata (title, channel, duration, description, available subtitle languages)",
      inputSchema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "YouTube video URL or ID",
          },
        },
        required: ["url"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_transcript": {
        const { url, lang = "en" } = args;
        const json3 = await fetchTranscript(url, lang);
        const text = parseJson3(json3);
        return { content: [{ type: "text", text }] };
      }

      case "get_metadata": {
        const { url } = args;
        const metadata = await fetchMetadata(url);
        return {
          content: [{ type: "text", text: JSON.stringify(metadata, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
