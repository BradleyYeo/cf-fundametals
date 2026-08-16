import { paymentMiddleware } from "x402-next";
import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { resumeData } from "@/data/resume";
// @ts-ignore - The IDE might complain but this works in Cloudflare's runtime
import { env } from "cloudflare:workers";

/**
 * Middleware combining:
 * 1. Markdown content negotiation — intercepts Accept: text/markdown on page routes
 *    and returns inline markdown (free-tier alternative to CF's Markdown for Agents)
 * 2. x402 payment gating — protects /api/* routes with micropayments
 * 3. Server-side view tracking for agents (since they don't execute JS)
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

// Known bot/crawler User-Agent patterns
const BOT_REGEX =
  /bot|crawler|spider|crawling|gptbot|claudebot|chatgpt|bingbot|googlebot|yandexbot|baiduspider|duckduckbot|slurp|facebookexternalhit|linkedinbot|twitterbot|applebot|semrushbot|ahrefsbot|dotbot|petalbot|bytespider|ccbot|anthropic|cohere-ai|ia_archiver|isitagentready|cloudflare|agent/i;

function isBot(userAgent: string): boolean {
  return BOT_REGEX.test(userAgent);
}

/** Build markdown string from resume data */
function buildMarkdown(): string {
  const r = resumeData.en;

  const jobsMarkdown = r.experience.jobs
    .map(
      (job) =>
        `### ${job.role} — ${job.company}, ${job.location} (${job.period})\n\n${job.bullets.map((b) => `- ${b}`).join("\n")}`
    )
    .join("\n\n");

  const certsMarkdown = r.certifications.items.map((c) => `- ${c}`).join("\n");
  const languagesMarkdown = r.skills.languages.items.map((s) => `- ${s}`).join("\n");
  const techMarkdown = r.skills.technology.items.map((s) => `- ${s}`).join("\n");

  return `# ${r.name}

> ${r.tagline}

${r.about}

- Email: ${r.email}
- Website: https://bradleyyeo.com

## ${r.skills.title}

### ${r.skills.languages.title}
${languagesMarkdown}

### ${r.skills.technology.title}
${techMarkdown}

## ${r.experience.title}

${jobsMarkdown}

## ${r.certifications.title}

${certsMarkdown}

## ${r.education.title}

### ${r.education.school}

${r.education.degree} — ${r.education.period}
`;
}

async function trackAgentView(): Promise<void> {
  const db = ((env as Record<string, any>)?.VIEWS_DB || process.env.VIEWS_DB) as any;
  const kv = ((env as Record<string, any>)?.VINEXT_KV_CACHE || process.env.VINEXT_KV_CACHE) as any;

  if (!db) return;

  try {
    await db
      .prepare(
        `CREATE TABLE IF NOT EXISTS page_views (
          visitor_type TEXT PRIMARY KEY,
          count INTEGER NOT NULL DEFAULT 0
        )`
      )
      .run();

    await db
      .prepare(
        `INSERT INTO page_views (visitor_type, count) VALUES (?, 1)
         ON CONFLICT(visitor_type) DO UPDATE SET count = count + 1`
      )
      .bind("agent")
      .run();

    if (kv) {
      await kv.delete("view_counts");
    }
  } catch (error) {
    console.error("Failed to track agent view in DB:", error);
  }
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;
  const accept = request.headers.get("accept") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";

  // 1. Server-side view tracking for agents
  // Agents don't run React/JS, so they won't trigger the client-side ViewCounter.
  if (pathname === "/") {
    const isAgentRequest = isBot(userAgent) || accept.includes("text/markdown");
    if (isAgentRequest) {
      await trackAgentView();
    }
  }

  // 2. Markdown content negotiation for page routes (not /api/*)
  if (!pathname.startsWith("/api/")) {
    if (accept.includes("text/markdown")) {
      const markdown = buildMarkdown();
      const tokenEstimate = Math.ceil(markdown.length / 4);

      const db = ((env as Record<string, unknown>)?.VIEWS_DB || process.env.VIEWS_DB);
      const kv = ((env as Record<string, unknown>)?.VINEXT_KV_CACHE || process.env.VINEXT_KV_CACHE);

      return new NextResponse(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "x-markdown-tokens": String(tokenEstimate),
          "Cache-Control": "no-store",
          "x-debug-has-db": db ? "true" : "false",
          "x-debug-has-kv": kv ? "true" : "false",
        },
      });
    }
  }

  // Bypass payment for public endpoints (views & human turnstile verification)
  if (pathname === "/api/views" || pathname === "/api/verify-turnstile") {
    return NextResponse.next();
  }

  // 3. x402 payment middleware for other /api/* routes
  return x402(request);
}

export const config = {
  // Run on API routes (for x402) and root page (for markdown negotiation & agent tracking)
  matcher: ["/api/:path*", "/api", "/"],
};
