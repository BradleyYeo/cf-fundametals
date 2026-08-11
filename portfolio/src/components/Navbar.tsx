"use client";

import { ThemeToggle } from "./ThemeToggle";
import { LanguageToggle } from "./LanguageToggle";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 backdrop-blur-xl bg-background/80">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
        <a
          href="#"
          className="flex items-center gap-2 text-lg font-bold tracking-tight group"
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white text-sm font-black">
            BY
          </span>
          <span className="hidden sm:inline text-foreground group-hover:text-accent transition-colors">
            Bradley Yeo
          </span>
        </a>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
