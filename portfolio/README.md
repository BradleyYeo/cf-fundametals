# Portfolio — Codebase Reading Guide

A bilingual personal portfolio built with **Next.js App Router** running on **Cloudflare Workers** via Vinext. This guide teaches you to read the codebase as a TypeScript beginner.

---

# TypeScript Basics You'll Need

Before reading any file, understand these three patterns that appear everywhere:

## `interface` — Describing the shape of data

```typescript
// Describes what a ViewCounts object must look like
interface ViewCounts {
  human: number;  // must have a "human" field of type number
  agent: number;  // must have an "agent" field of type number
}

// Usage: TypeScript now knows what fields this object has
const counts: ViewCounts = { human: 5, agent: 2 };
counts.human   // ✅ TypeScript knows this is a number
counts.foo     // ❌ TypeScript error: 'foo' doesn't exist
```

## `type` — Defining a union of allowed values

```typescript
// Language can only ever be "en" or "zh", never anything else
type Language = "en" | "zh";

// Theme can only be "light" or "dark"
type Theme = "light" | "dark";
```

## `as` — Type casting (telling TypeScript "trust me, this is X")

```typescript
// env is typed as unknown, but we know VIEWS_DB is a D1Database
const db = env.VIEWS_DB as D1Database;
```

## Early Returns (Guard Clauses)

You will often see functions that check for missing dependencies or invalid states and exit immediately:

```typescript
export async function GET() {
  // If the database binding isn't available, return a default response immediately
  if (!db) return NextResponse.json({ human: 0, agent: 0 });

  // Now we know db exists for the rest of the function!
  // This avoids wrapping the whole function in a giant `if (db) { ... }` block.
  const counts = await getCountsFromD1(db);
  // ...
}
```
This pattern flattens the code by removing deep nesting, making it much easier to read.

---

# How to Read the Codebase

## Reading Order

Start here → read in this order:

```
1. src/data/resume.ts                 ← Data (no framework code)
2. src/context/ThemeContext.tsx        ← React state basics
3. src/context/LanguageContext.tsx
4. src/app/layout.tsx                 ← App entry point
5. src/app/page.tsx                   ← Main page UI
6. src/components/ViewCounter.tsx      ← Client-side view tracking
7. src/components/EmailProtection.tsx  ← Client-side Turnstile challenge
8. src/app/api/views/route.ts         ← Server-side views + Cloudflare bindings
9. src/app/api/verify-turnstile/route.ts ← Server-side Turnstile verification + Secrets Store
```

---

# File-by-File Walkthrough

## `src/data/resume.ts` — Content Dictionary

The simplest file. Just a plain TypeScript object holding all content in both English and Chinese.

```typescript
export const resumeData = {
  en: { name: "Bradley Yeo Kian", ... },
  zh: { name: "杨建", ... },
};

// "en" | "zh" — this is the Language type used everywhere
export type Language = keyof typeof resumeData;
// keyof typeof X means "give me the keys of the object X as a type"
// Result: Language = "en" | "zh"
```

**Key concept**: `export` means other files can import this. `const` means it never changes at runtime.

---

## `src/context/ThemeContext.tsx` — Global State (Theme)

React Context lets you share state across the whole app without passing props everywhere.

```typescript
"use client"; // ← This tells Next.js: run this in the browser, not the server

// Step 1: Create a context (a "box" for shared state)
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
//                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
//                              TypeScript generic: what type is inside the box

// Step 2: Provider wraps the whole app and holds the actual state
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  //    ^value  ^setter     ^hook     ^initial value

  useEffect(() => {
    // Read from localStorage when the component first mounts
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []); // ← empty array = run once on mount

  useEffect(() => {
    // Whenever theme changes, update the HTML attribute and save it
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]); // ← [theme] = run whenever theme changes
}

// Step 3: Custom hook — consumer components call this to get the state
export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx; // Returns { theme, toggleTheme }
}
```

**The CSS connection**: When `data-theme="dark"` is set on `<html>`, the CSS in `globals.css` switches all `var(--color-*)` tokens to dark values. No JavaScript needed after that.

---

## `src/app/layout.tsx` — App Shell (Server Component)

This file has **no** `"use client"` directive — it runs on the server (Cloudflare Workers).

```typescript
// Server Component: no useState, no useEffect, no browser APIs
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>       {/* Client component — wraps everything */}
          <LanguageProvider>  {/* Client component — wraps everything */}
            <Navbar />
            <div>{children}</div>  {/* page.tsx renders here */}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Key concept**: In Next.js App Router, components without `"use client"` run on the server. Components with `"use client"` run in the browser. A server component can render client components — but NOT the other way around.

---

## `src/app/page.tsx` — Main Page (Client Component)

Because it starts with `"use client"`, this runs in the browser.

```typescript
"use client";

export default function Home() {
  const { language } = useLanguage(); // Gets "en" or "zh" from context
  const r = resumeData[language];     // r = the English or Chinese content object

  return (
    <main>
      <h1>{r.name}</h1>  {/* Renders "Bradley Yeo Kian" or Chinese name */}
      {/* ... */}
      <ViewCounter />  {/* Renders view count in footer */}
    </main>
  );
}
```

**Key concept**: `resumeData[language]` is dynamic key access. If `language === "en"`, it returns `resumeData.en`. This is how the whole bilingual system works — one line.

---

## `src/components/ViewCounter.tsx` — Client-Side View Tracking

This is the most complex client component. Read it in three chunks:

### Chunk 1: State setup

```typescript
const [counts, setCounts] = useState<ViewCounts | null>(null);
const [loading, setLoading] = useState(true);
// ViewCounts | null means: either a ViewCounts object, or nothing yet
```

### Chunk 2: The useEffect (runs once after page loads in browser)

```typescript
useEffect(() => {
  const SESSION_KEY = "portfolio_view_tracked";

  async function trackAndFetch() {
    // Check if user visited in this browser tab session
    const isFirstVisit = !sessionStorage.getItem(SESSION_KEY);
    const method = isFirstVisit ? "POST" : "GET";

    try {
      const res = await fetch("/api/views", { method });
      if (res.ok) {
        const data: ViewCounts = await res.json();
        setCounts(data);
        if (isFirstVisit) sessionStorage.setItem(SESSION_KEY, "1");
      }
    } catch {
      // Silently fail if offline or network drops
    } finally {
      setLoading(false);
    }
  }

  trackAndFetch();
}, []); // ← [] means run once when component mounts
```

### Chunk 3: Render

```typescript
if (loading) return <div>Loading page views...</div>;

// ?. is optional chaining: safe if counts is null
// ?? is nullish coalescing: fallback to 0 if null/undefined
const humanCount = counts?.human ?? 0;

return <div>{humanCount} human views · {agentCount} agent views</div>;
```

---

## `src/components/EmailProtection.tsx` — Client-Side Turnstile Challenge

This component protects your contact email address from web crawlers using Cloudflare Turnstile:

### How it works on the client:

```typescript
// 1. Loads Cloudflare Turnstile script dynamically with explicit rendering
<Script
  src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
  strategy="afterInteractive"
  onLoad={() => setScriptLoaded(true)}
/>

// 2. Renders Turnstile widget using public Site Key
widgetIdRef.current = window.turnstile.render(containerRef.current, {
  sitekey: "0x4AAAAAAERd011J3zBuICWo",
  action: "view_email",
  callback: (token: string) => {
    handleVerifyToken(token); // Browser sends token to backend
  },
  theme: "auto",
});

// 3. Verifies token via backend & dispatches CustomEvent on success
const res = await fetch("/api/verify-turnstile", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ token }),
});
const data = await res.json();
if (res.ok && data.success) {
  setIsVerified(true); // Reveals email address in UI
  window.dispatchEvent(new CustomEvent("human-verified", { detail: data.counts }));
}
```

**Key concept**: `window.dispatchEvent(new CustomEvent("human-verified", ...))` broadcasts an event across the page. `ViewCounter.tsx` listens to this event to increment the human visitor count instantly in the UI without a page reload.

---

## `src/app/api/views/route.ts` — Server API + Cloudflare Bindings

This is the most Cloudflare-specific file. It runs entirely on Cloudflare Workers — never in the browser.

### How Cloudflare Bindings Work

A **binding** is a service (database, cache, object storage) that Cloudflare injects directly into your Worker at runtime. You declare them in `wrangler.jsonc`; Cloudflare makes them available via:

```typescript
import { env } from "cloudflare:workers"; // ← Cloudflare-specific virtual module

// Cast to the correct type (env is typed as "unknown" by default)
const db = (env as Record<string, unknown>).VIEWS_DB as D1Database;
const kv = (env as Record<string, unknown>).VINEXT_KV_CACHE as KVNamespace;
```

`Record<string, unknown>` means "an object with string keys and unknown values" — it's a safe way to access arbitrary properties without TypeScript erroring.

### D1 Database (Persistent storage)

D1 is Cloudflare's serverless SQLite database. The API is a thin wrapper around SQL:

```typescript
// Prepared statement with ? placeholder — prevents SQL injection
await db
  .prepare("INSERT INTO page_views (visitor_type, count) VALUES (?, 1) ON CONFLICT(visitor_type) DO UPDATE SET count = count + 1")
  .bind(visitorType)  // ← substitutes ? with the actual value
  .run();
```

`ON CONFLICT DO UPDATE` is an **upsert** — insert if the row doesn't exist, update if it does.

### KV Cache (Fast read cache)

KV is Cloudflare's key-value store. Reads are <15ms globally. Used here as a 5-minute read cache in front of D1:

```typescript
// If KV is available, try to read from it first (fast)
if (kv) {
  const cached = await kv.get("view_counts", "json");
  if (cached) return NextResponse.json(cached); // Cache hit → skip D1
}

// Cache miss → read from D1
const counts = await getCountsFromD1(db);

// Populate KV for the next visitor
if (kv) {
  await kv.put("view_counts", JSON.stringify(counts), {
    expirationTtl: 300, // TTL in seconds → KV auto-deletes after 5 min
  });
}
```

### Bot detection

```typescript
const BOT_REGEX = /bot|crawler|spider|googlebot|claudebot|.../i;

function isBot(userAgent: string): boolean {
  // .test() returns true if the User-Agent matches any bot keyword
  return BOT_REGEX.test(userAgent);
}
```

`/pattern/i` is a **regex** (regular expression). `/i` means case-insensitive. `.test(string)` returns `true` if the string matches the pattern in a single pass.

### HTTP route handlers

Next.js App Router uses filename conventions for API routes. In `app/api/views/route.ts`:

```typescript
// Named export "GET" → handles HTTP GET requests to /api/views
export async function GET() { ... }

// Named export "POST" → handles HTTP POST requests to /api/views
export async function POST(request: NextRequest) { ... }
```

---

## `src/app/api/verify-turnstile/route.ts` — Server Turnstile Verification + Secrets Store

This endpoint receives the client's Turnstile token, verifies it with Cloudflare's `siteverify` API using the private secret key retrieved from **Cloudflare Secrets Store**, and increments the verified human view count in D1.

### Cloudflare Secrets Store Binding (Async Interface)

Cloudflare Secrets Store provides centralized, encrypted secret management. In Workers, Secrets Store bindings are typed as `SecretsStoreSecret`:

```typescript
interface SecretsStoreSecret {
  get(): Promise<string>;
}
```

Because `.get()` returns a `Promise<string>`, the Worker retrieves the secret asynchronously:

```typescript
// Extract secret from Secrets Store binding or fallback to process.env
let secretKey = process.env.TURNSTILE_SECRET_KEY || "";
const secretBinding = (env as Record<string, unknown>).TURNSTILE_SECRET_KEY as
  | { get: () => Promise<string> }
  | string
  | undefined;

if (secretBinding) {
  if (typeof secretBinding === "string") {
    secretKey = secretBinding;
  } else if (typeof secretBinding.get === "function") {
    secretKey = await secretBinding.get(); // ← Asynchronous retrieval
  }
}
```

### Cloudflare Siteverify Verification

The Worker posts the client's token and the private secret to Cloudflare's verification endpoint:

```typescript
const formData = new URLSearchParams();
formData.append("secret", secretKey);
formData.append("response", token);
if (ip) formData.append("remoteip", ip);

const verifyRes = await fetch(
  "https://challenges.cloudflare.com/turnstile/v0/siteverify",
  {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData,
  }
);

const outcome = await verifyRes.json();
// outcome = { success: true/false, "error-codes": [...], action: "view_email", hostname: "bradleyyeo.com" }
```

When validation succeeds:
1. Increments `human` count in D1 SQLite database.
2. Updates KV cache (`view_counts`).
3. Returns `{ success: true, counts: { human: N, agent: M } }`.

---

# Cloudflare Services Used in This App

| Service | Binding / Mechanism | Used In | Purpose |
|---|---|---|---|
| **D1 Database** | `VIEWS_DB` | `route.ts`, `verify-turnstile/route.ts` | Persistent view count storage (SQLite) |
| **Workers KV** | `VINEXT_KV_CACHE` | `route.ts`, `verify-turnstile/route.ts` | Fast read cache for view counts + Next.js ISR |
| **Secrets Store** | `TURNSTILE_SECRET_KEY` | `verify-turnstile/route.ts` | Centralized encrypted storage for Turnstile private key |
| **Assets** | `ASSETS` | Vinext internals | Serves `dist/client/` static assets |
| **Turnstile** | `challenges.cloudflare.com` | `EmailProtection.tsx` | Non-intrusive CAPTCHA challenge before email reveal |

---

# Key Separation: Secrets Store vs. Repository

| Item | Location | Public / Private | Purpose |
|---|---|---|---|
| **Site Key** (`0x4AAAAAA...`) | Frontend (`EmailProtection.tsx`) | Public | Rendered on client to display challenge widget |
| **Wrangler Bindings** | `wrangler.jsonc` | Public | Tells Worker which store/secret name to bind at runtime |
| **Secret Key** (`0x4AAAAAA...`) | Cloudflare Secrets Store | **Private** | Kept secure on server to authenticate with `siteverify` |

---

# Full Request Flows

## 1. Page Visit & View Tracking Flow

```
Browser opens page
  ↓
Cloudflare Workers receives request
  ↓ (Vinext routes it)
Server renders layout.tsx + page.tsx HTML → sent to browser
  ↓
Browser loads page, React hydrates
  ↓
ViewCounter.tsx mounts → useEffect fires (first visit this session)
  ↓
POST /api/views
  → route.ts checks User-Agent → classifies as "human"
  → D1: UPSERT human count +1
  → KV: write fresh cache
  → returns { human: N, agent: M }
  ↓
ViewCounter.tsx updates UI
```

## 2. Turnstile Email Unlock & Human Verification Flow

```
User clicks "Show Email"
  ↓
EmailProtection.tsx mounts Turnstile widget (Site Key: 0x4AAAAAAERd011J3zBuICWo)
  ↓
User solves / passes Turnstile challenge → receives browser token
  ↓
EmailProtection.tsx sends POST /api/verify-turnstile { token }
  ↓
Worker retrieves secret via await env.TURNSTILE_SECRET_KEY.get() (Secrets Store)
  ↓
Worker calls POST https://challenges.cloudflare.com/turnstile/v0/siteverify
  ↓
Turnstile confirms token is valid
  ↓
Worker increments D1 "human" count + refreshes KV cache
  ↓
Worker returns { success: true, counts: { human: N, agent: M } }
  ↓
EmailProtection.tsx displays decoded email & dispatches "human-verified" CustomEvent
  ↓
ViewCounter.tsx receives event listener → updates counter in footer instantly!
```

---

# Development & Build Commands

| Command | What it does |
|---|---|
| `npm run dev` | Next.js dev server (port 3000, Node.js) |
| `npm run dev:vinext` | Vinext dev server (port 3001, simulates Workers) |
| `npm run build:vinext` | Compiles for Cloudflare Workers → `dist/` |
| `npx wrangler deploy` | Uploads `dist/` to Cloudflare Workers |
| `npx wrangler d1 execute portfolio-views --remote --command "SELECT * FROM page_views;"` | Query live D1 database |
| `npx wrangler kv key get --binding=VINEXT_KV_CACHE "view_counts"` | Inspect KV cache |

---

# Key Mental Models

## Server vs. Client code

- **No `"use client"`** = runs on Cloudflare Workers (server) — can access `env`, D1, KV
- **`"use client"`** = runs in the browser — can use `useState`, `useEffect`, `localStorage`, `sessionStorage`
- **Never mix**: A client component cannot import from `cloudflare:workers`

## Why KV in front of D1?

D1 is a SQLite database — reads involve a SQL query and disk I/O. KV is an in-memory key-value store replicated globally — reads are <15ms from anywhere. Putting KV in front of D1 means: most visitors read from KV (fast + cheap), only the first visitor after a write hits D1.

## Why Vinext instead of plain Next.js?

Cloudflare Workers runs JavaScript in **V8 Isolates**, not Node.js. Vinext re-compiles Next.js's server runtime to be compatible with the Workers environment using Vite's build system.
