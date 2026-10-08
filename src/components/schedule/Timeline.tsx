"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Appointment, Doctor, Minutes, Service } from "@/lib/types";
import { fmtRange, fmtTime } from "@/lib/time";

export interface TimelineRow {
  id: string;
  kind: "doctor" | "room";
  label: string;
  sub?: string;
  tone?: "ok" | "bad" | "muted";
}

interface Props {
  rows: TimelineRow[];
  appointments: Appointment[];
  from: Minutes;
  to: Minutes;
  doctors: Doctor[];
  services: Service[];
  highlight?: { start: Minutes; end: Minutes; tone: "ok" | "bad" | "neutral"; label?: string } | null;
  newIds?: string[];
  /** Нерабочее время по строкам врачей */
  offHours?: Record<string, [Minutes, Minutes][]>;
  onCellClick?: (row: TimelineRow, minute: Minutes) => void;
  onBlockClick?: (a: Appointment) => void;
  labelWidth?: number;
  rowHeight?: number;
  minWidth?: number;
  sectionTitles?: Record<string, string>;
}

export function Timeline({
  rows, appointments, from, to, doctors, services, highlight, newIds = [], offHours, onCellClick, onBlockClick,
  labelWidth = 168, rowHeight = 52, minWidth = 640, sectionTitles,
}: Props) {
  const span = to - from;
  const pct = (m: Minutes) => ((m - from) / span) * 100;
  const hours: Minutes[] = [];
  for (let t = Math.ceil(from / 60) * 60; t <= to; t += 60) hours.push(t);
  const halfSteps: Minutes[] = [];
  for (let t = from; t < to; t += 30) halfSteps.push(t);

  const blockLabel = (a: Appointment, row: TimelineRow) => {
    if (a.kind === "block") return a.note ?? "Занят";
    const svc = services.find((s) => s.id === a.serviceId)?.title ?? "";
    if (row.kind === "doctor") return a.roomId ? `№${a.roomId} · ${svc}` : svc;
    const d = doctors.find((x) => x.id === a.doctorId);
    return d ? `${d.lastName} ${d.firstName[0]}.${d.patronymic[0]}.` : "";
  };

  const tracksStyle = { left: labelWidth, width: `calc(100% - ${labelWidth}px)` };

  return (
    <div className="scrollbar-none overflow-x-auto">
      <div className="relative" style={{ minWidth }}>
        {/* шкала времени */}
        <div className="relative h-8" style={{ marginLeft: labelWidth }}>
          {hours.map((h) => (
            <span key={h} className="absolute -translate-x-1/2 text-[11px] tabular-nums text-muted" style={{ left: `${pct(h)}%` }}>
              {fmtTime(h)}
            </span>
          ))}
        </div>

        <div className={`relative ${highlight?.label ? "mb-9" : ""}`}>
          {/* вертикальная сетка */}
          <div className="pointer-events-none absolute inset-y-0" style={tracksStyle}>
            {hours.map((h) => (
              <span key={h} className="absolute inset-y-0 w-px bg-line" style={{ left: `${pct(h)}%` }} />
            ))}
          </div>

          {rows.map((row, i) => {
            const list = appointments.filter((a) => a.status !== "cancelled" && (row.kind === "doctor" ? a.doctorId === row.id : a.roomId === row.id));
            const section = sectionTitles?.[row.id];
            return (
              <div key={row.id}>
                {section && <div className={`text-[10.5px] font-semibold uppercase tracking-[0.2em] text-teal ${i ? "pt-5" : ""} pb-2`}>{section}</div>}
                <div className="relative flex border-t border-line/70" style={{ height: rowHeight }}>
                  <div className="flex shrink-0 flex-col justify-center pr-3" style={{ width: labelWidth }}>
                    <div
                      className={`truncate text-[13.5px] font-medium ${
                        row.tone === "ok" ? "text-ok" : row.tone === "bad" ? "text-danger" : row.tone === "muted" ? "text-muted" : "text-forest-deep"
                      }`}
                    >
                      {row.label}
                    </div>
                    {row.sub && <div className="truncate text-[11px] text-muted">{row.sub}</div>}
                  </div>
                  <div className="relative flex-1">
                    {offHours?.[row.id]?.map(([a, b], k) => (
                      <div key={k} className="hatch absolute inset-y-1 rounded-md" style={{ left: `${pct(Math.max(a, from))}%`, width: `${pct(Math.min(b, to)) - pct(Math.max(a, from))}%` }} />
                    ))}
                    {onCellClick &&
                      halfSteps.map((t) => (
                        <button
                          key={t}
                          type="button"
                          aria-label={`${row.label}, ${fmtTime(t)}`}
                          onClick={() => onCellClick(row, t)}
                          className="absolute inset-y-1 rounded-md transition hover:bg-sage/50"
                          style={{ left: `${pct(t)}%`, width: `${(30 / span) * 100}%` }}
                        />
                      ))}
                    <AnimatePresence>
                      {list.map((a) => {
                        const isNew = newIds.includes(a.id);
                        const left = pct(Math.max(a.start, from));
                        const width = pct(Math.min(a.end, to)) - left;
                        if (width <= 0) return null;
                        const doctorRow = row.kind === "doctor";
                        return (
                          <motion.button
                            type="button"
                            key={a.id}
                            initial={isNew ? { opacity: 0, scaleX: 0.3 } : false}
                            animate={{ opacity: 1, scaleX: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            onClick={() => onBlockClick?.(a)}
                            title={`${fmtRange(a.start, a.end)} · ${blockLabel(a, row)}`}
                            className={`absolute inset-y-1.5 origin-left overflow-hidden rounded-lg px-2 text-left text-[11px] leading-tight ${
                              a.kind === "block"
                                ? "border border-gold/50 bg-gold-soft text-[#6b4f1a]"
                                : doctorRow
                                  ? "bg-forest text-milk"
                                  : "hatch border border-linen bg-sand text-ink/80"
                            } ${isNew ? "ring-2 ring-gold ring-offset-1 ring-offset-milk" : ""} ${onBlockClick ? "cursor-pointer" : "cursor-default"}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                          >
                            <span className="block truncate pt-1 font-semibold tabular-nums">{fmtRange(a.start, a.end)}</span>
                            <span className="block truncate opacity-80">{blockLabel(a, row)}</span>
                          </motion.button>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            );
          })}

          {/* подсветка проверяемого времени */}
          {highlight && (
            <div className="pointer-events-none absolute inset-y-0" style={tracksStyle}>
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`absolute inset-y-0 rounded-lg border-2 ${
                  highlight.tone === "ok" ? "border-ok bg-ok/10" : highlight.tone === "bad" ? "border-danger bg-danger/10" : "border-teal bg-teal/10"
                }`}
                style={{ left: `${pct(highlight.start)}%`, width: `${pct(highlight.end) - pct(highlight.start)}%` }}
              >
                {highlight.label && (
                  <span
                    className={`absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold text-milk ${
                      highlight.tone === "ok" ? "bg-ok" : highlight.tone === "bad" ? "bg-danger" : "bg-teal"
                    }`}
                  >
                    {highlight.label}
                  </span>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
