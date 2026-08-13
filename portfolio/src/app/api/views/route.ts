import { NextRequest, NextResponse } from "next/server";
import { env } from "cloudflare:workers";

// Known bot/crawler User-Agent patterns
const BOT_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /crawling/i,
  /gptbot/i,
  /claudebot/i,
  /chatgpt/i,
  /bingbot/i,
  /googlebot/i,
  /yandexbot/i,
  /baiduspider/i,
  /duckduckbot/i,
  /slurp/i,
  /facebookexternalhit/i,
  /linkedinbot/i,
  /twitterbot/i,
  /applebot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /dotbot/i,
  /petalbot/i,
  /bytespider/i,
  /ccbot/i,
  /anthropic/i,
  /cohere-ai/i,
  /ia_archiver/i,
  /isitagentready/i,
  /cloudflare/i,
  /agent/i,
];

function isBot(userAgent: string): boolean {
  return BOT_PATTERNS.some((pattern) => pattern.test(userAgent));
}

// Cloudflare Workers bindings accessed via the cloudflare:workers virtual module.
// env.VIEWS_DB is the D1 database binding.
// env.VINEXT_KV_CACHE is the KV namespace binding.
const db = (env as Record<string, unknown>).VIEWS_DB as D1Database | undefined;
const kv = (env as Record<string, unknown>).VINEXT_KV_CACHE as KVNamespace | undefined;

const KV_CACHE_KEY = "view_counts";
const KV_TTL_SECONDS = 300; // 5-minute cache

interface ViewCounts {
  human: number;
  agent: number;
}

async function ensureTable(db: D1Database): Promise<void> {
  await db
    .prepare(
      `CREATE TABLE IF NOT EXISTS page_views (
        visitor_type TEXT PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0
      )`
    )
    .run();
}

async function getCountsFromD1(db: D1Database): Promise<ViewCounts> {
  await ensureTable(db);
  const results = await db
    .prepare("SELECT visitor_type, count FROM page_views")
    .all<{ visitor_type: string; count: number }>();

  const counts: ViewCounts = { human: 0, agent: 0 };
  for (const row of results.results) {
    if (row.visitor_type === "human") counts.human = row.count;
    if (row.visitor_type === "agent") counts.agent = row.count;
  }
  return counts;
}

async function incrementCount(
  db: D1Database,
  visitorType: "human" | "agent"
): Promise<void> {
  await ensureTable(db);
  await db
    .prepare(
      `INSERT INTO page_views (visitor_type, count) VALUES (?, 1)
       ON CONFLICT(visitor_type) DO UPDATE SET count = count + 1`
    )
    .bind(visitorType)
    .run();
}

// GET /api/views — read counts (KV cache → D1 fallback)
export async function GET() {
  // Try KV cache first
  if (kv) {
    const cached = await kv.get(KV_CACHE_KEY, "json");
    if (cached) {
      return NextResponse.json(cached);
    }
  }

  // Fallback to D1
  if (db) {
    const counts = await getCountsFromD1(db);

    // Populate KV cache
    if (kv) {
      await kv.put(KV_CACHE_KEY, JSON.stringify(counts), {
        expirationTtl: KV_TTL_SECONDS,
      });
    }

    return NextResponse.json(counts);
  }

  // No bindings available (local dev without Wrangler)
  return NextResponse.json({ human: 0, agent: 0 });
}

// POST /api/views — increment view count
export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  const visitorType = isBot(userAgent) ? "agent" : "human";

  if (db) {
    await incrementCount(db, visitorType);

    // Invalidate KV cache so next GET picks up fresh data
    if (kv) {
      await kv.delete(KV_CACHE_KEY);
    }

    // Read fresh counts to return
    const counts = await getCountsFromD1(db);

    // Re-populate KV cache
    if (kv) {
      await kv.put(KV_CACHE_KEY, JSON.stringify(counts), {
        expirationTtl: KV_TTL_SECONDS,
      });
    }

    return NextResponse.json(counts);
  }

  return NextResponse.json({ human: 0, agent: 0 });
}
