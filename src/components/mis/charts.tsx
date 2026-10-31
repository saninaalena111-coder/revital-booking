"use client";

import { useState } from "react";
import type { ISODate } from "@/lib/types";
import { dayNum, fmtDay, fmtWeekdayShort } from "@/lib/time";

/**
 * Категориальная палитра объектов сети — порядок фиксирован, цвет закреплён за объектом.
 * Проверена валидатором dataviz (светлая тема): яркость, насыщенность, различимость
 * при нарушениях цветового зрения. Вторичная кодировка — подписи у линий и таблица.
 */
export const SERIES_COLORS = ["#0a8a6e", "#e0723a", "#4a77c9", "#c99400"];

/** Линейный график с перекрестием и подсказкой при наведении. Одна ось — проценты. */
export function LineChart({
  dates, series, height = 300, max = 100, unit = "%",
}: {
  dates: ISODate[];
  series: { id: string; title: string; values: number[]; color: string }[];
  height?: number;
  max?: number;
  unit?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const H = height;
  const pad = { l: 40, r: 92, t: 12, b: 28 };
  const x = (i: number) => pad.l + (i / Math.max(1, dates.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 25, 50, 75, 100].map((t) => (t / 100) * max);

  // Подписи у правого края: разводим, чтобы не наезжали друг на друга
  const ends = series.map((s) => ({ s, y: y(s.values.at(-1) ?? 0) })).sort((a, b) => a.y - b.y);
  for (let i = 1; i < ends.length; i++) if (ends[i].y - ends[i - 1].y < 16) ends[i].y = ends[i - 1].y + 16;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`График: ${series.map((s) => s.title).join(", ")}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (dates.length - 1));
          setHover(i >= 0 && i < dates.length ? i : null);
        }}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
            <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)">{t}{unit}</text>
          </g>
        ))}
        {dates.map((d, i) => (i % 7 === 0 || i === dates.length - 1) && (
          <text key={d} x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--color-muted)">{dayNum(d)} {fmtDay(d).split(" ")[1].slice(0, 3)}</text>
        ))}
        {series.map((s) => (
          <path key={s.id} d={s.values.map((v, i) => `${i ? "L" : "M"}${x(i)} ${y(v)}`).join("")} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {ends.map(({ s, y: ly }) => (
          <g key={s.id}>
            <circle cx={x(dates.length - 1)} cy={y(s.values.at(-1) ?? 0)} r={4} fill={s.color} stroke="var(--color-milk)" strokeWidth={2} />
            <text x={W - pad.r + 10} y={ly + 4} fontSize={12} fill="var(--color-ink)">{s.title} {s.values.at(-1)}{unit}</text>
          </g>
        ))}
        {hover !== null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="var(--color-ink)" strokeOpacity={0.25} />
            {series.map((s) => <circle key={s.id} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={s.color} stroke="var(--color-milk)" strokeWidth={2} />)}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-40 rounded-xl border border-line bg-milk px-3 py-2 text-[12.5px] shadow-[var(--shadow-lift)]"
          style={{ left: `${Math.min(70, (x(hover) / W) * 100)}%` }}
        >
          <div className="mb-1 font-medium text-forest-deep">{fmtWeekdayShort(dates[hover])}, {fmtDay(dates[hover])}</div>
          {series.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-1.5 text-ink/80"><i className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.title}</span>
              <b className="tabular-nums text-forest-deep">{s.values[hover]}{unit}</b>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Горизонтальные полосы: значение подписано текстом, подсказка при наведении */
export function BarList({
  rows, format = (v) => String(v), color = "var(--color-forest)", max,
}: {
  rows: { label: string; value: number; sub?: string; color?: string }[];
  format?: (v: number) => string;
  color?: string;
  max?: number;
}) {
  const top = max ?? Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} className="group" title={`${r.label}: ${format(r.value)}`}>
          <div className="flex items-baseline justify-between gap-3 text-[14px]">
            <span className="min-w-0 truncate text-ink/85">
              {r.label}
              {r.sub && <span className="ml-1.5 text-[12.5px] text-muted">{r.sub}</span>}
            </span>
            <b className="shrink-0 tabular-nums text-forest-deep">{format(r.value)}</b>
          </div>
          <div className="mt-1 h-2 rounded-full bg-cream">
            <div className="h-full rounded-full transition-all duration-700 group-hover:opacity-80" style={{ width: `${Math.max(2, (r.value / top) * 100)}%`, background: r.color ?? color }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
