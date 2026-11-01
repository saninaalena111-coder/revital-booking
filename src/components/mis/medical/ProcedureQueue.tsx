"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CalendarClock, Check, Clock, RotateCcw, UserX } from "lucide-react";
import { useState } from "react";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { catalogService, proceduresService, type SessionRow } from "@/services";
import { DEMO_NOW, DEMO_TODAY, fmtDay, fmtTime, fmtWeekdayLong } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { MisTitle } from "../MisShell";
import { card, EmptyState, Loading, SessionStatusPill, Stat, useToast } from "../ui";
import { cautionsFor } from "./Prescriptions";

/** Процедурный кабинет: очередь на день и отметка «выполнено» одним нажатием */
export function ProcedureQueue() {
  const { user } = useSession();
  const toast = useToast();
  const rooms = catalogService.medRooms("gelendzhik");
  const mine = rooms.filter((r) => r.nurseId === user?.id).map((r) => r.id);
  const [selected, setSelected] = useState<string[]>(mine.length ? mine : [rooms[0].id]);
  const [hideDone, setHideDone] = useState(false);
  const { data } = useService(() => proceduresService.queue(DEMO_TODAY, selected), [selected.join()]);

  const toggleRoom = (id: string) => setSelected((s) => (s.includes(id) ? (s.length > 1 ? s.filter((x) => x !== id) : s) : [...s, id]));
  const visible = data?.filter((r) => !hideDone || r.session.status === "planned") ?? [];
  const firstUpcoming = visible.find((r) => r.session.status === "planned" && r.session.end > DEMO_NOW)?.session.id;

  return (
    <>
      <MisTitle
        title="Процедурный кабинет"
        lead={<><span className="capitalize">{fmtWeekdayLong(DEMO_TODAY)}</span>, {fmtDay(DEMO_TODAY)}. Отметьте процедуру выполненной одним нажатием — у гостя сразу обновится курс.</>}
      />

      {/* выбор кабинетов */}
      <div className="mb-5">
        <div className="mb-2 text-[13px] text-muted">Кабинеты в очереди {mine.length > 0 && <button onClick={() => setSelected(mine)} className="ml-2 text-teal hover:underline">только мои</button>}</div>
        {/* на телефоне — лента с прокруткой, на планшете и ноутбуке — все кабинеты сразу */}
        <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          {rooms.map((r) => {
            const on = selected.includes(r.id);
            return (
              <button
                key={r.id}
                onClick={() => toggleRoom(r.id)}
                aria-pressed={on}
                className={`flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[14px] transition ${on ? "border-forest bg-forest text-milk" : "border-white/70 bg-milk/70 text-ink/80 shadow-[var(--shadow-soft)] backdrop-blur-sm hover:border-forest/40"}`}
              >
                {on && <Check size={14} />} №{r.number} · {r.title}
              </button>
            );
          })}
        </div>
      </div>

      {!data ? (
        <Loading />
      ) : (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="Всего на сегодня" value={data.length} />
            <Stat label="Выполнено" value={data.filter((r) => r.session.status === "done").length} tone="ok" />
            <Stat label="Осталось" value={data.filter((r) => r.session.status === "planned").length} tone="gold" />
            <Stat label="Не пришли" value={data.filter((r) => r.session.status === "missed").length} tone="danger" />
          </div>
          <label className="mb-4 flex cursor-pointer items-center justify-end gap-3 text-[14px] text-ink/80">
            Скрыть выполненные
            <Toggle checked={hideDone} onChange={setHideDone} label="Скрыть выполненные" />
          </label>

          {!visible.length ? (
            <EmptyState icon={Check} title={data.length ? "Все процедуры отмечены" : "На сегодня процедур нет"} text={data.length ? "Отличная работа! Выключите фильтр, чтобы увидеть выполненные." : "Выберите другой кабинет."} />
          ) : (
            <ol className="space-y-2">
              <AnimatePresence initial={false}>
                {visible.map((r) => (
                  <motion.li key={r.session.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
                    {r.session.id === firstUpcoming && (
                      <div className="mb-2 mt-3 flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.16em] text-gold">
                        <Clock size={14} /> Сейчас {fmtTime(DEMO_NOW)}
                        <span className="h-px flex-1 bg-gold/50" />
                      </div>
                    )}
                    <QueueRow row={r} onMessage={toast.show} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
        </>
      )}
      {toast.node}
    </>
  );
}

function QueueRow({ row, onMessage }: { row: SessionRow; onMessage: (t: string) => void }) {
  const { session: s, procedure, room, patient } = row;
  const [busy, setBusy] = useState(false);
  const cautions = cautionsFor(patient, procedure);
  const planned = s.status === "planned";

  const act = async (fn: () => Promise<unknown>, text?: string) => {
    setBusy(true);
    await fn();
    setBusy(false);
    if (text) onMessage(text);
  };

  return (
    <div className={`${card} flex flex-col gap-3 p-4 transition sm:flex-row sm:items-center sm:gap-5 sm:px-5 ${planned ? "" : "opacity-75"}`}>
      <div className="w-20 shrink-0 tabular-nums">
        <div className="text-[22px] font-semibold text-forest-deep">{fmtTime(s.start)}</div>
        <div className="text-[12.5px] text-muted">{procedure.durationMin} мин · №{room.number}</div>
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/mis/patient?id=${patient.id}&tab=schedule`} className="text-[16px] font-medium text-forest-deep hover:underline">
          {patient.lastName} {patient.firstName} {patient.patronymic}
        </Link>
        <div className="text-[14px] text-ink/80">
          {procedure.title} · <span className="text-muted">сеанс {row.index} из {row.total}</span>
          {patient.stay && <span className="text-muted"> · номер {patient.stay.roomNumber}</span>}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <SessionStatusPill status={s.status} />
          {!!patient.allergies?.length && (
            <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2.5 py-1 text-[12.5px] font-medium text-danger">
              <AlertTriangle size={13} /> Аллергия: {patient.allergies.join(", ")}
            </span>
          )}
          {cautions.slice(0, 1).map((c) => (
            <span key={c} className="rounded-full bg-gold-soft px-2.5 py-1 text-[12.5px] text-[#7a5a1c]">{c}</span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        {planned ? (
          <>
            <Button size="lg" disabled={busy} onClick={() => act(() => proceduresService.mark(s.id, "done"), `${patient.lastName}: ${procedure.title.toLowerCase()} — выполнено`)} className="flex-1 sm:flex-none">
              <Check size={19} /> Выполнено
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => act(async () => onMessage((await proceduresService.reschedule(s.id)).text))} aria-label="Перенести" title="Перенести на ближайшее свободное время">
              <CalendarClock size={17} /> <span className="hidden xl:inline">Перенести</span>
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => act(() => proceduresService.mark(s.id, "missed"), `${patient.lastName}: отмечено «гость не пришёл»`)} aria-label="Гость не пришёл" title="Гость не пришёл">
              <UserX size={17} /> <span className="hidden xl:inline">Не пришёл</span>
            </Button>
          </>
        ) : (
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => act(() => proceduresService.mark(s.id, "planned"), "Отметка снята")}>
            <RotateCcw size={15} /> Отменить отметку
          </Button>
        )}
      </div>
    </div>
  );
}
