import type { ReactNode } from "react";

type Tone = "neutral" | "forest" | "gold" | "ok" | "danger" | "sage" | "outline";

const tones: Record<Tone, string> = {
  neutral: "bg-sand text-ink/80",
  forest: "bg-forest text-milk",
  gold: "bg-gold-soft text-[#7a5a1c]",
  ok: "bg-ok-soft text-ok",
  danger: "bg-danger-soft text-danger",
  sage: "bg-sage-soft text-forest",
  outline: "border border-line text-muted",
};

export function Badge({ tone = "neutral", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
