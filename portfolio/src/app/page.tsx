"use client";

import { useLanguage } from "@/context/LanguageContext";
import { resumeData } from "@/data/resume";
import { SocialLinks } from "@/components/SocialLinks";
import { EmailProtection } from "@/components/EmailProtection";

export default function Home() {
  const { language } = useLanguage();
  const r = resumeData[language];

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 md:py-20">
      {/* ── Hero Section ── */}
      <section id="hero" className="animate-fade-in-up">
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-accent">
          {r.tagline}
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
          {r.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">
          {r.about}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <EmailProtection email={r.email} />
        </div>
        <div className="mt-6">
          <SocialLinks />
        </div>
      </section>

      <hr className="my-12 border-border" />

      {/* ── Skills Section ── */}
      <section id="skills" className="animate-fade-in-up delay-200">
        <SectionHeading>{r.skills.title}</SectionHeading>
        <div className="grid gap-6 sm:grid-cols-2">
          <SkillCard
            title={r.skills.languages.title}
            items={r.skills.languages.items}
          />
          <SkillCard
            title={r.skills.technology.title}
            items={r.skills.technology.items}
          />
        </div>
      </section>

      <hr className="my-12 border-border" />

      {/* ── Experience Section ── */}
      <section id="experience" className="animate-fade-in-up delay-300">
        <SectionHeading>{r.experience.title}</SectionHeading>
        <div className="space-y-8">
          {r.experience.jobs.map((job, i) => (
            <article
              key={i}
              className="group relative rounded-2xl border border-border bg-surface p-6
                hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
                transition-all duration-300"
            >
              {/* Accent line on the left */}
              <div className="absolute left-0 top-6 bottom-6 w-0.5 rounded-full bg-accent/0 group-hover:bg-accent transition-all duration-300" />

              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold">
                    {job.role}
                  </h3>
                  <p className="text-sm text-accent font-medium">
                    {job.company}, {job.location}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent">
                  {job.period}
                </span>
              </div>

              <ul className="mt-4 space-y-2">
                {job.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="relative pl-5 text-sm leading-relaxed text-muted before:absolute before:left-0 before:top-2 before:h-1.5 before:w-1.5 before:rounded-full before:bg-accent/60"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <hr className="my-12 border-border" />

      {/* ── Certifications Section ── */}
      <section id="certifications" className="animate-fade-in-up delay-400">
        <SectionHeading>{r.certifications.title}</SectionHeading>
        <div className="flex flex-wrap gap-2">
          {r.certifications.items.map((cert) => (
            <span
              key={cert}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface
                px-3.5 py-2 text-sm font-medium hover:border-accent/40 hover:bg-accent-subtle
                hover:text-accent transition-all duration-200 cursor-default"
            >
              <svg className="h-3.5 w-3.5 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {cert}
            </span>
          ))}
        </div>
      </section>

      <hr className="my-12 border-border" />

      {/* ── Education Section ── */}
      <section id="education" className="animate-fade-in-up delay-500">
        <SectionHeading>{r.education.title}</SectionHeading>
        <div className="rounded-2xl border border-border bg-surface p-6
          hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
          transition-all duration-300">
          <h3 className="text-lg font-bold">{r.education.school}</h3>
          <p className="mt-1 text-sm text-muted">{r.education.degree}</p>
          <span className="mt-2 inline-block rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent">
            {r.education.period}
          </span>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-20 border-t border-border pt-8 pb-12 text-center">
        <div className="flex justify-center mb-4">
          <SocialLinks />
        </div>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Bradley Yeo. Built with Next.js &
          Tailwind CSS.
        </p>
      </footer>
    </main>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 text-2xl font-bold tracking-tight flex items-center gap-3">
      <span className="inline-block h-5 w-1 rounded-full bg-accent" />
      {children}
    </h2>
  );
}

function SkillCard({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5
      hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5
      transition-all duration-300">
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-md bg-surface-elevated px-2.5 py-1 text-xs font-medium text-foreground/80
              hover:bg-accent-subtle hover:text-accent transition-colors duration-150"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
