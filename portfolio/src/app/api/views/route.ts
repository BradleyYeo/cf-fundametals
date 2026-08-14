import { NextRequest, NextResponse } from "next/server";
import { env } from "cloudflare:workers";

// Known bot/crawler User-Agent patterns
const BOT_REGEX =
  /bot|crawler|spider|crawling|gptbot|claudebot|chatgpt|bingbot|googlebot|yandexbot|baiduspider|duckduckbot|slurp|facebookexternalhit|linkedinbot|twitterbot|applebot|semrushbot|ahrefsbot|dotbot|petalbot|bytespider|ccbot|anthropic|cohere-ai|ia_archiver|isitagentready|cloudflare|agent/i;

function isBot(userAgent: string): boolean {
  return BOT_REGEX.test(userAgent);
}

// Cloudflare Workers bindings accessed via the cloudflare:workers virtual module.
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
  const { results } = await db
    .prepare("SELECT visitor_type, count FROM page_views")
    .all<{ visitor_type: string; count: number }>();

  const counts: ViewCounts = { human: 0, agent: 0 };
  for (const row of results) {
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

async function writeCache(counts: ViewCounts): Promise<void> {
  if (kv) {
    await kv.put(KV_CACHE_KEY, JSON.stringify(counts), {
      expirationTtl: KV_TTL_SECONDS,
    });
  }
}

// GET /api/views — read counts (KV cache → D1 fallback)
export async function GET() {
  if (!db) return NextResponse.json({ human: 0, agent: 0 });

  if (kv) {
    const cached = await kv.get(KV_CACHE_KEY, "json");
    if (cached) return NextResponse.json(cached);
  }

  const counts = await getCountsFromD1(db);
  await writeCache(counts);
  return NextResponse.json(counts);
}

// POST /api/views — increment view count
export async function POST(request: NextRequest) {
  if (!db) return NextResponse.json({ human: 0, agent: 0 });

  const userAgent = request.headers.get("user-agent") ?? "";
  const visitorType = isBot(userAgent) ? "agent" : "human";

  await incrementCount(db, visitorType);
  const counts = await getCountsFromD1(db);
  await writeCache(counts);
  return NextResponse.json(counts);
}
