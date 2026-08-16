import { NextRequest, NextResponse } from "next/server";
import { env } from "cloudflare:workers";

// Cloudflare Workers bindings accessed via the cloudflare:workers virtual module.
const db = (env as Record<string, unknown>).VIEWS_DB as D1Database | undefined;
const kv = (env as Record<string, unknown>).VINEXT_KV_CACHE as KVNamespace | undefined;

const KV_CACHE_KEY = "view_counts";
const KV_TTL_SECONDS = 300; // 5-minute cache

interface ViewCounts {
  human: number;
  agent: number;
}

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
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

async function incrementHumanCount(db: D1Database): Promise<void> {
  await ensureTable(db);
  await db
    .prepare(
      `INSERT INTO page_views (visitor_type, count) VALUES ('human', 1)
       ON CONFLICT(visitor_type) DO UPDATE SET count = count + 1`
    )
    .run();
}

async function writeCache(counts: ViewCounts): Promise<void> {
  if (kv) {
    await kv.put(KV_CACHE_KEY, JSON.stringify(counts), {
      expirationTtl: KV_TTL_SECONDS,
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { token?: string };
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Missing Turnstile verification token" },
        { status: 400 }
      );
    }

    const secretKey =
      ((env as Record<string, unknown>).TURNSTILE_SECRET_KEY as string) ||
      process.env.TURNSTILE_SECRET_KEY ||
      "1x0000000000000000000000000000000AA"; // Default testing secret key (always passes with testing sitekeys)

    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for") ||
      "";

    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const verifyRes = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const outcome = (await verifyRes.json()) as TurnstileVerifyResponse;

    if (!outcome.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Turnstile verification failed",
          details: outcome["error-codes"] || [],
        },
        { status: 400 }
      );
    }

    let counts: ViewCounts = { human: 1, agent: 0 };
    if (db) {
      await incrementHumanCount(db);
      counts = await getCountsFromD1(db);
      await writeCache(counts);
    }

    return NextResponse.json({
      success: true,
      counts,
    });
  } catch (error) {
    console.error("Turnstile verification error:", error);
    return NextResponse.json(
      { success: false, error: "Internal verification error" },
      { status: 500 }
    );
  }
}
