"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

interface EmailProtectionProps {
  email: string;
}

// Cloudflare Turnstile sitekey
const DEFAULT_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "0x4AAAAAAERd011J3zBuICWo";

export function EmailProtection({ email }: EmailProtectionProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  const handleVerifyToken = async (token: string) => {
    setIsVerifying(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/verify-turnstile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsVerified(true);
        setShowChallenge(false);
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("human-verified", { detail: data.counts })
          );
        }
      } else {
        setErrorMessage(data.error || "Turnstile verification failed. Please retry.");
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      }
    } catch {
      setErrorMessage("Network error during verification. Please retry.");
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (showChallenge && scriptLoaded && containerRef.current && window.turnstile) {
      if (!widgetIdRef.current) {
        try {
          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: DEFAULT_SITE_KEY,
            action: "view_email",
            callback: (token: string) => {
              handleVerifyToken(token);
            },
            "error-callback": () => {
              setErrorMessage("Turnstile encountered an error. Please reload or retry.");
            },
            "expired-callback": () => {
              setErrorMessage("Turnstile challenge expired. Please verify again.");
              if (widgetIdRef.current && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current);
              }
            },
            theme: "auto",
          });
        } catch (e) {
          console.error("Turnstile render error:", e);
        }
      }
    }
  }, [showChallenge, scriptLoaded]);

  if (isVerified) {
    return (
      <a
        href={`mailto:${email}`}
        className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white
          shadow-lg shadow-accent/25 hover:bg-accent-hover hover:shadow-accent/40
          transition-all duration-200 hover:-translate-y-0.5 animate-fade-in-up"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {email}
      </a>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onLoad={() => setScriptLoaded(true)}
      />

      {!showChallenge ? (
        <button
          id="reveal-email-btn"
          onClick={() => setShowChallenge(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-surface border border-accent/40 px-4 py-2 text-sm font-semibold text-accent
            hover:bg-accent-subtle hover:border-accent
            transition-all duration-200 cursor-pointer shadow-sm"
        >
          <svg
            className="h-4 w-4 text-accent"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Verify with Cloudflare Turnstile to View Email
        </button>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <div className="text-xs text-muted">
            {isVerifying ? "Verifying with Cloudflare..." : "Verify you are human to unlock email:"}
          </div>
          <div ref={containerRef} className="min-h-[65px]" />
          {errorMessage && (
            <div className="text-xs text-red-500 font-medium">
              {errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
