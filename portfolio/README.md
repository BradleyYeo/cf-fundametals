# Portfolio Architecture & Technical Documentation

A full-stack, bilingual personal portfolio application built with **Next.js (App Router)** and **Vinext** (Vite-powered Next.js API-compatible framework for Cloudflare Workers), styled with Tailwind CSS v4 using a custom Cloudflare Orange design system.

---

# Codebase Architecture

```
portfolio/
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind v4 design system with CSS custom properties & animations
│   │   ├── layout.tsx          # Root layout with ThemeProvider, LanguageProvider & Navbar
│   │   ├── page.tsx            # Main portfolio page (Hero, Skills, Experience, Certs, Education)
│   │   └── robots.ts           # Dynamic SEO robots.txt metadata route
│   ├── components/
│   │   ├── EmailProtection.tsx # Cloudflare Turnstile human verification component
│   │   ├── LanguageToggle.tsx  # English / Chinese (EN/中) language switcher
│   │   ├── Navbar.tsx          # Sticky glassmorphism header navigation bar
│   │   ├── SocialLinks.tsx     # GitHub, LinkedIn, and Substack link buttons
│   │   └── ThemeToggle.tsx     # Dark / Light mode toggle button
│   ├── context/
│   │   ├── LanguageContext.tsx # React Context for global language state (en | zh)
│   │   └── ThemeContext.tsx    # React Context for global theme state with localStorage persistence
│   └── data/
│       └── resume.ts           # Strongly typed bilingual content dictionary (English & Chinese)
├── public/
│   └── robots.txt              # Static crawler permissions fallback
├── vite.config.ts              # Vinext / Vite compiler configuration for RSC & Cloudflare Workers
├── wrangler.jsonc              # Cloudflare Workers deployment manifest (KV binding & assets config)
└── package.json                # Project dependencies and script definitions
```

---

# Cloudflare-Specific Code & Integrations

## 1. Cloudflare Turnstile Bot Protection (`EmailProtection.tsx`)
- **File**: [EmailProtection.tsx](file:///Users/bradleyyeo/Documents/learn/cf-fundametals/portfolio/src/components/EmailProtection.tsx)
- **Functionality**: Protects user email address from automated web scrapers.
- **Implementation**:
  - Dynamically injects Cloudflare's Turnstile script (`https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit`).
  - Displays a **"Verify with Cloudflare Turnstile to View Email"** challenge widget.
  - Unlocks and reveals the clickable `mailto:` link only after the `onSuccess` callback completes.
  - Defaults to Cloudflare's official testing sitekey (`1x00000000000000000000AA`) or reads `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.

## 2. Vinext Framework for Cloudflare Workers (`vite.config.ts`)
- **File**: `vite.config.ts`
- **Functionality**: Enables React Server Components (RSC) and Next.js App Router compilation target for Cloudflare Workers instead of traditional Node.js servers.
- **Outputs**:
  - `dist/server/` — JavaScript bundle compiled for V8 Isolates execution.
  - `dist/client/` — Static assets served via Cloudflare Assets.

## 3. Cloudflare Workers KV Cache Binding (`wrangler.jsonc`)
- **File**: [wrangler.jsonc](file:///Users/bradleyyeo/Documents/learn/cf-fundametals/portfolio/wrangler.jsonc)
- **Functionality**: Binds the Cloudflare Workers KV namespace (`VINEXT_KV_CACHE`) to the execution environment.
- **Usage**:
  - Vinext uses the KV store for low-latency ($<15\text{ ms}$) server-side data caching.
  - Auto-patched with the live KV namespace ID via Terraform (`terraform/portfolio.tf`).

## 4. Design Accent Color (Cloudflare Orange)
- **File**: [globals.css](file:///Users/bradleyyeo/Documents/learn/cf-fundametals/portfolio/src/app/globals.css)
- **Functionality**: Incorporates Cloudflare Orange (`#f6821f`) as the primary accent color token (`--color-accent`).

---

# Key Component Details

## 1. State Management (`LanguageContext` & `ThemeContext`)
- **`ThemeContext`**: Handles dark and light mode switching by updating `data-theme` attribute on `<html>` and persisting settings in `localStorage`.
- **`LanguageContext`**: Manages current language state (`en` or `zh`), dynamically re-rendering resume content from `resume.ts`.

## 2. Bilingual Content Dictionary (`resume.ts`)
- **File**: [resume.ts](file:///Users/bradleyyeo/Documents/learn/cf-fundametals/portfolio/src/data/resume.ts)
- Contains complete resumes in both English and Chinese (`en` and `zh`), providing type-safe property access across all UI sections.

---

# Available Development & Build Commands

- **`npm run dev:vinext`**: Starts the Vinext / Vite dev server on port `3001` with fast HMR.
- **`npm run build:vinext`**: Builds production output for Cloudflare Workers (`dist/server` and `dist/client`).
- **`npm run deploy:vinext`**: Deploys the built worker and static assets to Cloudflare Workers using Wrangler.
- **`npm run dev`**: Runs standard Next.js dev server on port `3000`.
- **`npm run build`**: Builds standard Next.js production bundle.
