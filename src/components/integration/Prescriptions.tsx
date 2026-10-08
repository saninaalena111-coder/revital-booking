"use client";

import { motion } from "framer-motion";
import { Bath, CalendarClock, Hand, Waves } from "lucide-react";
import { useState } from "react";
import { useService } from "@/hooks/useService";
import { integrationService } from "@/services";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

const ICONS = [Hand, Bath, Waves];

export function StageBadge() {
  return <Badge tone="gold">Этап 2 — интеграция медицинских назначений</Badge>;
}

/** Перспективный функционал: назначения терапевта из МИС (не реализован) */
export function Prescriptions() {
  const { data } = useService(() => integrationService.samplePrescriptions(), []);
  const [open, setOpen] = useState<string | null>(null);
  const current = data?.find((p) => p.id === open);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {data?.map((p, i) => {
          const Icon = ICONS[i % ICONS.length];
          const left = p.prescribed - p.done;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="relative flex flex-col rounded-[28px] border border-dashed border-gold/60 bg-milk p-6"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-soft text-[#7a5a1c]">
                  <Icon size={19} strokeWidth={1.4} />
                </span>
                <span className="text-[11px] uppercase tracking-wider text-muted">пример</span>
              </div>
              <div className="font-display mt-5 text-[28px] text-forest-deep">{p.title}</div>
              <div className="text-sm text-muted">{p.note}</div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <Stat label="Назначено" value={p.prescribed} />
                <Stat label="Пройдено" value={p.done} />
                <Stat label="Осталось" value={left} accent />
              </div>
              <div className="mt-4 flex gap-1">
                {Array.from({ length: p.prescribed }).map((_, k) => (
                  <span key={k} className={`h-1.5 flex-1 rounded-full ${k < p.done ? "bg-forest" : "bg-sand"}`} />
                ))}
              </div>
              <Button variant="secondary" className="mt-6" onClick={() => setOpen(p.id)}>
                <CalendarClock size={16} /> Выбрать время
              </Button>
            </motion.div>
          );
        })}
      </div>

      <Modal open={!!current} onClose={() => setOpen(null)} title={current ? `${current.title}: выбор времени` : ""}>
        <StageBadge />
        <p className="mt-4 text-[15px] leading-relaxed text-ink/80">
          На втором этапе здесь откроется календарь только для разрешённых пациенту процедур. Система снова проверит всё сразу:
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          {["назначение врача", "специалист", "кабинет", "расписание"].map((x, i) => (
            <span key={x} className="flex items-center gap-2">
              <span className="rounded-full bg-sage-soft px-3 py-1.5 text-forest">{x}</span>
              {i < 3 && <span className="text-gold">+</span>}
            </span>
          ))}
        </div>
        <p className="mt-5 text-sm text-muted">
          Требует доступа к назначениям врача в МИС «Санаториум». В текущем прототипе не реализовано.
        </p>
      </Modal>
    </>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl px-2 py-2.5 ${accent ? "bg-forest text-milk" : "bg-cream/70"}`}>
      <div className="font-display text-2xl leading-none">{value}</div>
      <div className={`mt-1 text-[10.5px] ${accent ? "text-sage" : "text-muted"}`}>{label}</div>
    </div>
  );
}
