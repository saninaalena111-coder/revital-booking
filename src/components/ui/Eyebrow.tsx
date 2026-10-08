import type { ReactNode } from "react";

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal ${className}`}>
      <span className="h-px w-8 bg-gold" />
      {children}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, lead, className = "", center = false }: { eyebrow?: string; title: ReactNode; lead?: ReactNode; className?: string; center?: boolean }) {
  return (
    <div className={`${center ? "mx-auto text-center [&>div]:justify-center" : ""} max-w-3xl ${className}`}>
      {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
      <h2 className="font-display text-[34px] leading-[1.05] text-forest-deep sm:text-5xl">{title}</h2>
      {lead && <p className="mt-5 text-[17px] leading-relaxed text-muted">{lead}</p>}
    </div>
  );
}
