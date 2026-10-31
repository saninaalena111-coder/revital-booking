"use client";

import { Hourglass, Sparkles } from "lucide-react";
import { useState, type ReactNode } from "react";
import { FEATURES, STAGES, type FeatureId } from "@/config/roadmap";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** Модальное окно «В разработке»: что будет, на каком этапе, польза */
export function ComingSoonModal({ feature, open, onClose }: { feature: FeatureId; open: boolean; onClose: () => void }) {
  const f = FEATURES[feature];
  return (
    <Modal open={open} onClose={onClose} title={f.title}>
      <StageTag stage={f.stage} />
      <p className="mt-4 text-[15px] leading-relaxed text-ink/85">{f.what}</p>
      <div className="mt-4 flex gap-3 rounded-2xl bg-sage-soft/70 p-4 text-[14px] text-forest">
        <Sparkles size={18} className="mt-0.5 shrink-0" />
        <span>{f.benefit}</span>
      </div>
      <Button className="mt-6 w-full" onClick={onClose}>
        Понятно
      </Button>
    </Modal>
  );
}

function StageTag({ stage }: { stage: keyof typeof STAGES }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-[12.5px] font-medium text-[#7a5a1c]">
      <Hourglass size={13} /> В разработке — этап {stage}: {STAGES[stage].toLowerCase()}
    </span>
  );
}

/** Кнопка функции, которой пока нет: по нажатию объясняет, когда она появится */
export function ComingSoonButton({
  feature, children, variant = "secondary", size = "md", className = "",
}: {
  feature: FeatureId;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "gold";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {children}
        <Hourglass size={13} className="opacity-50" aria-label="в разработке" />
      </Button>
      <ComingSoonModal feature={feature} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Плашка внутри экрана: раздел или блок, который появится позже */
export function ComingSoonBanner({ feature, className = "" }: { feature: FeatureId; className?: string }) {
  const f = FEATURES[feature];
  return (
    <div className={`rounded-3xl border border-dashed border-gold/60 bg-gold-soft/25 p-5 sm:p-6 ${className}`}>
      <StageTag stage={f.stage} />
      <div className="mt-3 text-lg font-semibold text-forest-deep">{f.title}</div>
      <p className="mt-1 text-[14.5px] leading-relaxed text-muted">{f.what}</p>
      <p className="mt-2 text-[14px] text-forest">{f.benefit}</p>
    </div>
  );
}
