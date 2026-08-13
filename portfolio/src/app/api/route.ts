import { NextResponse } from "next/server";

/**
 * GET /api — API index
 *
 * Returns a description of available API endpoints.
 * Protected by x402 payment middleware — agents must pay to access.
 */
export async function GET() {
  return NextResponse.json({
    name: "Bradley Yeo Portfolio API",
    version: "1.0.0",
    endpoints: {
      "/api": {
        methods: ["GET"],
        description: "This index — lists available API endpoints",
      },
      "/api/views": {
        methods: ["GET", "POST"],
        description:
          "Page view counters. GET returns {human, agent} counts. POST increments based on User-Agent.",
      },
    },
    markdown: {
      llms_txt: "/llms.txt",
      accept_header:
        "Send Accept: text/markdown to GET / for a markdown version of the page",
    },
  });
}
