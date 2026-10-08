"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Presentation, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { db } from "@/mock/db";

/** Подсказка для показа руководству: семь вопросов, на которые отвечает прототип */
const TOUR = [
  { n: 1, q: "Как записывается пациент", href: "/booking" },
  { n: 2, q: "Чем отличаются гости и амбулаторные пациенты", href: "/booking" },
  { n: 3, q: "Почему нельзя смотреть только на свободный кабинет", href: "/logic?case=busy-doctor" },
  { n: 4, q: "Как одновременно блокируются врач и кабинет", href: "/logic?case=example-1" },
  { n: 5, q: "Зачем нужен API «Санаториума»", href: "/how-it-works#api" },
  { n: 6, q: "Зачем нужны события об изменении записи", href: "/how-it-works#events" },
  { n: 7, q: "Ценность личного кабинета, SMS и аналитики", href: "/cabinet" },
];

export function DemoNavigator() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-4 right-4 z-[55] sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="glass absolute bottom-14 right-0 w-[min(360px,calc(100vw-32px))] rounded-3xl p-5 shadow-[var(--shadow-lift)]"
          >
            <div className="mb-1 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">Демо для руководства</div>
              <button onClick={() => setOpen(false)} aria-label="Закрыть" className="text-muted hover:text-forest">
                <X size={16} />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted">Семь вопросов, на которые отвечает прототип:</p>
            <ol className="space-y-1">
              {TOUR.map((t) => (
                <li key={t.n}>
                  <Link href={t.href} onClick={() => setOpen(false)} className="group flex items-start gap-3 rounded-2xl px-2 py-2 hover:bg-milk/80">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-[11px] font-semibold text-milk">{t.n}</span>
                    <span className="text-[14px] leading-snug text-ink/85 group-hover:text-forest">{t.q}</span>
                  </Link>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-xs text-muted">
              <span>Все данные вымышлены</span>
              <button onClick={() => db.reset()} className="inline-flex items-center gap-1.5 hover:text-forest">
                <RotateCcw size={13} /> Сбросить демо
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass-dark flex h-11 items-center gap-2 rounded-full pl-3 pr-4 text-[13px] font-medium text-milk shadow-[var(--shadow-lift)]"
      >
        <Presentation size={16} strokeWidth={1.6} /> Демо-сценарии
      </button>
    </div>
  );
}
