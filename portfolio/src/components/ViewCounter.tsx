"use client";

import { useEffect, useState } from "react";

interface ViewCounts {
  human: number;
  agent: number;
}

export function ViewCounter() {
  const [counts, setCounts] = useState<ViewCounts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const SESSION_KEY = "portfolio_view_tracked";

    async function trackAndFetch() {
      // Only POST once per browser session
      if (!sessionStorage.getItem(SESSION_KEY)) {
        try {
          const res = await fetch("/api/views", { method: "POST" });
          if (res.ok) {
            const data: ViewCounts = await res.json();
            setCounts(data);
            sessionStorage.setItem(SESSION_KEY, "1");
            setLoading(false);
            return;
          }
        } catch {
          // Silently fail
        }
      }

      // Fetch current counts (cache hit path)
      try {
        const res = await fetch("/api/views");
        if (res.ok) {
          setCounts(await res.json());
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }

    trackAndFetch();
  }, []);

  if (loading) {
    return (
      <div className="mt-4 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs text-muted animate-pulse">
          <span>Loading page views...</span>
        </div>
      </div>
    );
  }

  const humanCount = counts?.human ?? 0;
  const agentCount = counts?.agent ?? 0;

  return (
    <div className="mt-4 flex items-center justify-center">
      <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-1.5 text-xs text-muted hover:border-accent/30 transition-colors duration-200">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <svg
            className="h-3.5 w-3.5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          {humanCount.toLocaleString()} {humanCount === 1 ? "human view" : "human views"}
        </span>
        <span className="text-border">·</span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <svg
            className="h-3.5 w-3.5 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          {agentCount.toLocaleString()} {agentCount === 1 ? "agent view" : "agent views"}
        </span>
      </div>
    </div>
  );
}
