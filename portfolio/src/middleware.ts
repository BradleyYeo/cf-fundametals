import { paymentMiddleware } from "x402-next";
import { NextRequest, NextResponse } from "next/server";
import { resumeData } from "@/data/resume";

/**
 * Middleware combining:
 * 1. Markdown content negotiation — intercepts Accept: text/markdown on page routes
 *    and returns inline markdown (free-tier alternative to CF's Markdown for Agents)
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

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Markdown content negotiation for page routes (not /api/*)
  // When an agent sends Accept: text/markdown, return markdown inline
  if (!pathname.startsWith("/api/")) {
    const accept = request.headers.get("accept") ?? "";
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

  // x402 payment middleware for /api/* routes
  return x402(request);
}

export const config = {
  // Run on API routes (for x402) and root page (for markdown negotiation)
  matcher: ["/api/:path*", "/api", "/"],
};
