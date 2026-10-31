"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Circle, Clock, FileText, Inbox, Loader2, PenLine, Send, XCircle, type LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { DocStatus, SessionStatus } from "@/lib/types";
import { DOC_STATUS_LABEL, SESSION_STATUS_LABEL } from "@/services";

/** Карточка рабочего экрана МИС */
export const card = "rounded-3xl border border-line bg-milk";

type Tone = "ok" | "wait" | "info" | "danger" | "muted" | "gold";

const TONES: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  wait: "bg-sage-soft text-forest",
  info: "bg-[#e3ecf0] text-[#2f5a6b]",
  danger: "bg-danger-soft text-danger",
  muted: "bg-sand text-ink/70",
  gold: "bg-gold-soft text-[#7a5a1c]",
};

/** Статус цветом И словом — не только цветом */
export function StatusPill({ tone, icon: Icon, children, className = "" }: { tone: Tone; icon?: LucideIcon; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12.5px] font-medium leading-none ${TONES[tone]} ${className}`}>
      {Icon && <Icon size={13} strokeWidth={2} />}
      {children}
    </span>
  );
}

const SESSION_TONE: Record<SessionStatus, [Tone, LucideIcon]> = {
  planned: ["wait", Clock],
  done: ["ok", CheckCircle2],
  missed: ["danger", XCircle],
  cancelled: ["muted", Circle],
};

export function SessionStatusPill({ status }: { status: SessionStatus }) {
  const [tone, icon] = SESSION_TONE[status];
  return <StatusPill tone={tone} icon={icon}>{SESSION_STATUS_LABEL[status]}</StatusPill>;
}

const DOC_TONE: Record<DocStatus, [Tone, LucideIcon]> = {
  draft: ["muted", FileText],
  signed: ["wait", PenLine],
  sent: ["info", Send],
  registered: ["ok", CheckCircle2],
  error: ["danger", AlertTriangle],
};

export function DocStatusPill({ status }: { status: DocStatus }) {
  const [tone, icon] = DOC_TONE[status];
  return <StatusPill tone={tone} icon={icon}>{DOC_STATUS_LABEL[status]}</StatusPill>;
}

/** Прогресс курса: «4 из 10» и полоска */
export function CourseBar({ done, total, missed = 0, className = "" }: { done: number; total: number; missed?: number; className?: string }) {
  return (
    <div className={className}>
      <div className="flex h-2 overflow-hidden rounded-full bg-cream">
        <div className="bg-ok transition-all duration-500" style={{ width: `${(done / Math.max(total, 1)) * 100}%` }} />
        <div className="bg-danger/50 transition-all duration-500" style={{ width: `${(missed / Math.max(total, 1)) * 100}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, text, action }: { icon?: LucideIcon; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-milk p-8 text-center sm:p-10">
      <Icon size={26} strokeWidth={1.5} className="mx-auto text-muted" />
      <div className="mt-3 text-lg font-semibold text-forest-deep">{title}</div>
      {text && <p className="mx-auto mt-1 max-w-md text-[15px] text-muted">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Loading({ className = "h-64" }: { className?: string }) {
  return (
    <div className={`grid place-items-center rounded-3xl bg-milk/60 text-muted ${className}`}>
      <Loader2 className="animate-spin" />
    </div>
  );
}

/** Маленький показатель для шапки экрана */
export function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: "ok" | "danger" | "gold" }) {
  return (
    <div className={`${card} px-5 py-4`}>
      <div className="text-[13px] text-muted">{label}</div>
      <div className={`font-display mt-1 text-[32px] leading-none ${tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger" : tone === "gold" ? "text-[#a07a2f]" : "text-forest-deep"}`}>
        {value}
      </div>
    </div>
  );
}

/** Всплывающее подтверждение действия */
export function useToast() {
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);
  const show = (text: string) => setToast({ text, key: Date.now() });
  const node = (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          role="status"
          className="fixed bottom-20 left-1/2 z-[70] flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-2 rounded-full bg-forest-deep px-5 py-3 text-[14px] text-milk shadow-[var(--shadow-lift)]"
        >
          <CheckCircle2 size={17} className="shrink-0 text-sage" /> {toast.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
  return { show, node };
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex min-h-10 items-center gap-1.5 text-[14px] text-muted hover:text-forest">
      ← {children}
    </Link>
  );
}
