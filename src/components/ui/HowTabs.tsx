"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

const TABS = [
  { href: "/logic", label: "Логика расписания" },
  { href: "/how-it-works", label: "Интеграция с МИС" },
  { href: "/requirements", label: "Что нужно от МИС" },
];

/** Навигация по разделу «Как это работает» */
export function HowTabs() {
  const pathname = usePathname();
  return (
    <div className="scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="inline-flex gap-1 rounded-full border border-line bg-cream/70 p-1">
        {TABS.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${active ? "text-milk" : "text-ink/70 hover:text-forest"}`}>
              {active && <motion.span layoutId="how-tab" className="absolute inset-0 rounded-full bg-forest" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
              <span className="relative">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PageIntro({ eyebrow, title, lead }: { eyebrow: string; title: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-8 sm:pt-12">
      <HowTabs />
      <div className="mt-10 max-w-4xl">
        <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal">
          <span className="h-px w-8 bg-gold" />
          {eyebrow}
        </div>
        <h1 className="font-display text-[40px] leading-[1.02] text-forest-deep sm:text-6xl">{title}</h1>
        {lead && <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted">{lead}</p>}
      </div>
    </div>
  );
}
