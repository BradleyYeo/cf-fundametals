import { paymentMiddleware } from "x402-next";
import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware combining:
 * 1. Markdown content negotiation — intercepts Accept: text/markdown on page routes
 *    and rewrites to /api/markdown (free-tier alternative to CF's Markdown for Agents)
 * 2. x402 payment gating — protects /api/* routes with micropayments
 */

const x402 = paymentMiddleware(
  "0xE04c6c2A20b38c8Fb9A8E7Cafa89eA4763B50d9D",
  {
    "/api/*": {
      price: "$0.001",
      network: "base",
    },
  }
);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Markdown content negotiation for page routes (not /api/*)
  // When an agent sends Accept: text/markdown, rewrite to the markdown API route
  if (!pathname.startsWith("/api/")) {
    const accept = request.headers.get("accept") ?? "";
    if (accept.includes("text/markdown")) {
      const markdownUrl = new URL("/api/markdown", request.url);
      const response = await fetch(markdownUrl.toString(), {
        headers: request.headers,
      });

      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "x-markdown-tokens":
            response.headers.get("x-markdown-tokens") ?? "",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  // x402 payment middleware for /api/* routes
  return x402(request);
}

export const config = {
  // Run on API routes (for x402) and root page (for markdown negotiation)
  matcher: ["/api/:path*", "/"],
};
