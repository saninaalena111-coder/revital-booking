"use client";

import Link from "next/link";
import { useState } from "react";
import type { ISODate, Minutes } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { catalogService, proceduresService, type SessionRow } from "@/services";
import { addDays, dayNum, DEMO_NOW, DEMO_TODAY, fmtRange, fmtTime, fmtWeekdayShort, toMin } from "@/lib/time";
import { GUEST_MEALS } from "@/lib/scheduling/planner";
import { LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MisTitle } from "../MisShell";
import { card, EmptyState, Loading, SessionStatusPill } from "../ui";

const FROM = toMin("09:00");
const TO = toMin("18:00");
const LANE = 26;

/** Раскладка сеансов по дорожкам: в кабинете на 4 ванны одновременно идут до 4 процедур */
function lanes(rows: SessionRow[]) {
  const ends: Minutes[] = [];
  return rows.map((r) => {
    let i = ends.findIndex((e) => e <= r.session.start);
    if (i === -1) i = ends.push(0) - 1;
    ends[i] = r.session.end;
    return { row: r, lane: i };
  });
}

const BLOCK: Record<string, string> = {
  planned: "bg-forest text-milk",
  done: "bg-ok-soft text-ok border border-ok/30",
  missed: "bg-danger-soft text-danger border border-danger/30",
};

/** Загрузка кабинетов: кто и когда занят — таймлайн по дорожкам с учётом вместимости */
export function RoomsLoad() {
  const { sanatoriumId, sanatorium } = useSession();
  const [date, setDate] = useState<ISODate>(DEMO_TODAY);
  const [open, setOpen] = useState<SessionRow | null>(null);
  // У двух санаториев Геленджика общий медицинский центр — его кабинеты и показываем
  const san = sanatoriumId === "all" ? "gelendzhik" : sanatoriumId;
  const hasRooms = catalogService.medRooms(san).length > 0;
  const { data } = useService(() => proceduresService.roomsLoad(date, san), [date, san]);
  const pct = (m: Minutes) => ((m - FROM) / (TO - FROM)) * 100;
  const hours = Array.from({ length: (TO - FROM) / 60 + 1 }, (_, i) => FROM + i * 60);

  return (
    <>
      <MisTitle title="Загрузка кабинетов" lead="Каждая строка — кабинет, полоски — процедуры гостей. Серые зоны — время питания гостей: на него процедуры не назначаются." />
      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {Array.from({ length: 7 }, (_, i) => addDays(DEMO_TODAY, i)).map((d) => (
          <button key={d} onClick={() => setDate(d)} className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border ${d === date ? "border-forest bg-forest text-milk" : "border-line bg-milk text-ink/80"}`}>
            <span className="text-[18px] font-semibold leading-none">{dayNum(d)}</span>
            <span className="mt-1 text-[11px]">{d === DEMO_TODAY ? "сегодня" : fmtWeekdayShort(d)}</span>
          </button>
        ))}
      </div>

      {!hasRooms ? (
        <EmptyState title="Кабинеты объекта ещё не заведены" text={`Подробное расписание кабинетов в демо есть для Геленджика. ${sanatorium?.title ?? ""} подключается так же.`} />
      ) : !data ? (
        <Loading className="h-[480px]" />
      ) : (
        <div className={`${card} p-4 sm:p-5`}>
          <div className="mb-4 flex flex-wrap gap-4 text-[13px] text-muted">
            <span className="flex items-center gap-1.5"><i className="h-3 w-5 rounded bg-forest" /> Запланирована</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-5 rounded border border-ok/30 bg-ok-soft" /> Выполнена</span>
            <span className="flex items-center gap-1.5"><i className="h-3 w-5 rounded border border-danger/30 bg-danger-soft" /> Гость не пришёл</span>
            <span className="flex items-center gap-1.5"><i className="hatch h-3 w-5 rounded" /> Питание гостей</span>
          </div>
          <div className="scrollbar-none overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="relative ml-[200px] h-6">
                {hours.map((h) => (
                  <span key={h} className="absolute -translate-x-1/2 text-[11px] tabular-nums text-muted" style={{ left: `${pct(h)}%` }}>{fmtTime(h)}</span>
                ))}
              </div>
              {data.map(({ room, sessions }) => {
                const laid = lanes(sessions);
                const count = Math.max(room.capacity, ...laid.map((l) => l.lane + 1));
                const busy = sessions.reduce((s, r) => s + (r.session.end - r.session.start), 0);
                const load = Math.round((busy / ((TO - FROM - 60) * room.capacity)) * 100);
                return (
                  <div key={room.id} className="flex border-t border-line/70 py-1.5">
                    <div className="w-[200px] shrink-0 pr-3">
                      <div className="truncate text-[14px] font-medium text-forest-deep">№{room.number} · {room.title}</div>
                      <div className="text-[12px] text-muted">{room.capacity} {room.capacity === 1 ? "место" : room.capacity < 5 ? "места" : "мест"} · загрузка {load}%</div>
                    </div>
                    <div className="relative flex-1" style={{ height: count * LANE + 4 }}>
                      {hours.map((h) => <span key={h} className="absolute inset-y-0 w-px bg-line" style={{ left: `${pct(h)}%` }} />)}
                      {GUEST_MEALS.filter((m) => m.end > FROM && m.start < TO).map((m) => (
                        <div key={m.title} className="hatch absolute inset-y-0" style={{ left: `${pct(Math.max(m.start, FROM))}%`, width: `${pct(Math.min(m.end, TO)) - pct(Math.max(m.start, FROM))}%` }} />
                      ))}
                      {date === DEMO_TODAY && <span className="absolute inset-y-0 z-10 w-0.5 bg-gold" style={{ left: `${pct(DEMO_NOW)}%` }} />}
                      {laid.map(({ row, lane }) => (
                        <button
                          key={row.session.id}
                          onClick={() => setOpen(row)}
                          title={`${fmtRange(row.session.start, row.session.end)} · ${row.patient.lastName} · ${row.procedure.title}`}
                          className={`absolute truncate rounded-md px-1.5 text-left text-[11px] leading-[22px] ${BLOCK[row.session.status] ?? BLOCK.planned}`}
                          style={{ top: 2 + lane * LANE, height: LANE - 4, left: `${pct(row.session.start)}%`, width: `${pct(row.session.end) - pct(row.session.start)}%` }}
                        >
                          {row.patient.lastName}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.procedure.title}>
        {open && (
          <>
            <dl className="space-y-2 text-[15px]">
              <div><dt className="inline text-muted">Гость: </dt><dd className="inline font-medium">{open.patient.lastName} {open.patient.firstName} {open.patient.patronymic}</dd></div>
              <div><dt className="inline text-muted">Время: </dt><dd className="inline">{fmtRange(open.session.start, open.session.end)}</dd></div>
              <div><dt className="inline text-muted">Кабинет: </dt><dd className="inline">№{open.room.number} · {open.room.title}</dd></div>
              <div><dt className="inline text-muted">Курс: </dt><dd className="inline">сеанс {open.index} из {open.total}</dd></div>
            </dl>
            <div className="mt-3"><SessionStatusPill status={open.session.status} /></div>
            <div className="mt-6 flex justify-end gap-2">
              <LinkButton href={`/mis/patient?id=${open.patient.id}&tab=schedule`} variant="secondary">Расписание гостя</LinkButton>
            </div>
          </>
        )}
      </Modal>
      <p className="mt-3 text-[13px] text-muted">
        Нужно отметить процедуры? Откройте <Link href="/mis/procedures" className="text-teal hover:underline">процедурный кабинет</Link>.
      </p>
    </>
  );
}
