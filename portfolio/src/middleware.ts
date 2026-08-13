import { paymentMiddleware } from "x402-next";
import { NextRequest, NextResponse, NextFetchEvent } from "next/server";
import { resumeData } from "@/data/resume";

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

// Known bot/crawler User-Agent patterns (copied from views API)
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /crawling/i, /gptbot/i, /claudebot/i,
  /chatgpt/i, /bingbot/i, /googlebot/i, /yandexbot/i, /baiduspider/i,
  /duckduckbot/i, /slurp/i, /facebookexternalhit/i, /linkedinbot/i,
  /twitterbot/i, /applebot/i, /semrushbot/i, /ahrefsbot/i, /dotbot/i,
  /petalbot/i, /bytespider/i, /ccbot/i, /anthropic/i, /cohere-ai/i,
  /ia_archiver/i, /isitagentready/i, /cloudflare/i
];

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

/** Build markdown string from resume data */
function buildMarkdown(): string {
  const r = resumeData.en;
  const lines: string[] = [
    `# ${r.name}`,
    "",
    `> ${r.tagline}`,
    "",
    r.about,
    "",
    `- Email: ${r.email}`,
    `- Website: https://bradleyyeo.com`,
    "",
    `## ${r.skills.title}`,
    "",
    `### ${r.skills.languages.title}`,
    ...r.skills.languages.items.map((s) => `- ${s}`),
    "",
    `### ${r.skills.technology.title}`,
    ...r.skills.technology.items.map((s) => `- ${s}`),
    "",
    `## ${r.experience.title}`,
    "",
  ];

  for (const job of r.experience.jobs) {
    lines.push(`### ${job.role} — ${job.company}, ${job.location} (${job.period})`);
    lines.push("");
    for (const b of job.bullets) {
      lines.push(`- ${b}`);
    }
    lines.push("");
  }

  lines.push(`## ${r.certifications.title}`);
  lines.push("");
  for (const c of r.certifications.items) {
    lines.push(`- ${c}`);
  }
  lines.push("");

  lines.push(`## ${r.education.title}`);
  lines.push("");
  lines.push(`### ${r.education.school}`);
  lines.push("");
  lines.push(`${r.education.degree} — ${r.education.period}`);
  lines.push("");

  return lines.join("\n");
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
      event.waitUntil(
        fetch(new URL("/api/views", request.url), {
          method: "POST",
          headers: {
            "user-agent": "agent", // Force agent tracking
          },
        }).catch(() => {}) // Silently fail if something goes wrong
      );
    }
  }

  // 2. Markdown content negotiation for page routes (not /api/*)
  if (!pathname.startsWith("/api/")) {
    if (accept.includes("text/markdown")) {
      const markdown = buildMarkdown();
      const tokenEstimate = Math.ceil(markdown.length / 4);

      return new NextResponse(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "x-markdown-tokens": String(tokenEstimate),
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  // Bypass payment for the views endpoint
  if (pathname === "/api/views") {
    return NextResponse.next();
  }

  // 3. x402 payment middleware for other /api/* routes
  return x402(request);
}

export const config = {
  // Run on API routes (for x402) and root page (for markdown negotiation & agent tracking)
  matcher: ["/api/:path*", "/api", "/"],
};
