"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DoorOpen } from "lucide-react";
import { useMemo, useState } from "react";
import type { ISODate, Slot } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { appointmentsService, doctorsService } from "@/services";
import { dayNum, fmtDay, fmtTime, fmtWeekdayShort, DEMO_TODAY } from "@/lib/time";

interface Props {
  doctorIds: string[];
  serviceId: string;
  dates: ISODate[];
  value?: Slot | null;
  onChange: (s: Slot) => void;
  initialDate?: ISODate;
}

const GROUPS = [
  { title: "Утро", test: (m: number) => m < 12 * 60 },
  { title: "День", test: (m: number) => m >= 12 * 60 && m < 16 * 60 },
  { title: "Вечер", test: (m: number) => m >= 16 * 60 },
];

export function SlotPicker({ doctorIds, serviceId, dates, value, onChange, initialDate }: Props) {
  const key = doctorIds.join(",") + serviceId + dates[0] + dates.length;
  const { data: availability } = useService(() => appointmentsService.availabilityByDay(doctorIds, serviceId, dates), [key]);
  const { data: doctors } = useService(() => doctorsService.list(), []);
  const [picked, setDate] = useState<ISODate | null>(value?.date ?? null);
  // Начальная дата: initialDate, иначе первый день со свободным временем
  const date =
    picked ??
    (availability ? (initialDate && availability[initialDate] > 0 && initialDate) || dates.find((d) => availability[d] > 0) || dates[0] : null);

  const { data: daySlots, loading } = useService(async () => {
    if (!date) return [] as Slot[];
    const lists = await Promise.all(doctorIds.map((id) => appointmentsService.slots(id, serviceId, date)));
    // «Ближайший свободный врач»: на каждое время берём первого свободного специалиста
    const byTime = new Map<number, Slot>();
    lists.flat().forEach((s) => !byTime.has(s.start) && byTime.set(s.start, s));
    return [...byTime.values()].sort((a, b) => a.start - b.start);
  }, [key, date]);

  const multi = doctorIds.length > 1;
  const nameOf = (id: string) => {
    const d = doctors?.find((x) => x.id === id);
    return d ? `${d.firstName[0]}. ${d.patronymic[0]}. ${d.lastName}` : "";
  };

  const grouped = useMemo(
    () => GROUPS.map((g) => ({ ...g, slots: (daySlots ?? []).filter((s) => g.test(s.start)) })).filter((g) => g.slots.length),
    [daySlots],
  );

  return (
    <div>
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {dates.map((d) => {
          const n = availability?.[d] ?? 0;
          const sel = d === date;
          return (
            <button
              key={d}
              type="button"
              disabled={!availability || n === 0}
              onClick={() => setDate(d)}
              className={`relative flex w-[68px] shrink-0 flex-col items-center rounded-2xl border px-2 py-3 transition ${
                sel ? "border-forest bg-forest text-milk shadow-[var(--shadow-soft)]" : n ? "border-line bg-milk hover:border-teal/50" : "border-transparent bg-cream/60 text-muted/60"
              }`}
            >
              <span className={`text-[11px] uppercase tracking-wider ${sel ? "text-sage" : "text-muted"}`}>{fmtWeekdayShort(d)}</span>
              <span className="font-display mt-0.5 text-[26px] leading-none">{dayNum(d)}</span>
              <span className={`mt-1.5 text-[10.5px] ${sel ? "text-sage" : n ? "text-teal" : ""}`}>
                {!availability ? "…" : n ? (d === DEMO_TODAY ? "сегодня" : `${n} окон`) : "нет мест"}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 min-h-[180px]">
        {date && (
          <div className="mb-4 flex items-baseline justify-between">
            <div className="font-display text-2xl text-forest-deep">{fmtDay(date)}</div>
            <div className="text-xs text-muted">{daySlots ? `${daySlots.length} свободных` : ""}</div>
          </div>
        )}
        <AnimatePresence mode="wait">
          <motion.div key={date ?? "none"} initial={{ opacity: 0, y: 6 }} animate={{ opacity: loading && !daySlots?.length ? 0.4 : 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            {grouped.length === 0 && !loading && <p className="rounded-2xl bg-cream/70 p-5 text-sm text-muted">На этот день свободного времени нет — выберите другой день.</p>}
            <div className="space-y-5">
              {grouped.map((g) => (
                <div key={g.title}>
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{g.title}</div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-6">
                    {g.slots.map((s) => {
                      const sel = value?.date === s.date && value.start === s.start && value.doctorId === s.doctorId;
                      return (
                        <button
                          key={s.start}
                          type="button"
                          onClick={() => onChange(s)}
                          className={`rounded-2xl border px-2 py-3 text-center transition ${sel ? "border-forest bg-forest text-milk" : "border-line bg-milk hover:border-teal hover:text-forest"}`}
                        >
                          <div className="text-[15px] font-semibold tabular-nums">{fmtTime(s.start)}</div>
                          {multi && <div className={`mt-0.5 truncate text-[10.5px] ${sel ? "text-sage" : "text-muted"}`}>{nameOf(s.doctorId)}</div>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-line p-4 text-[13px] leading-relaxed text-muted">
        <DoorOpen size={18} strokeWidth={1.4} className="mt-0.5 shrink-0 text-teal" />
        Показано только время, когда свободны и врач, и подходящий кабинет. Кабинет система подберёт сама — вы увидите его после подтверждения.
      </div>
    </div>
  );
}
