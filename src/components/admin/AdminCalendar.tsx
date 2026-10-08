"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Check, CheckCircle2, MousePointerClick, X, XCircle } from "lucide-react";
import { useState } from "react";
import type { Appointment, ISODate, Minutes, SlotCheck } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { appointmentsService, doctorsService, roomsService } from "@/services";
import { addDays, dayNum, DEMO_TODAY, daysBetween, fmtDay, fmtRange, fmtTime, fmtWeekdayShort, WORKDAY_END, WORKDAY_START } from "@/lib/time";
import { doctorDayStatus, DOCTOR_STATUS_LABEL } from "@/lib/scheduling/engine";
import { Timeline, type TimelineRow } from "@/components/schedule/Timeline";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AdminTitle } from "./AdminShell";
import { AttributionTable } from "./AdminViews";

export function AdminCalendar({ initialDate }: { initialDate: ISODate }) {
  const [date, setDate] = useState<ISODate>(initialDate);
  const [explain, setExplain] = useState<{ row: TimelineRow; check?: SlotCheck; minute: Minutes } | null>(null);
  const [open, setOpen] = useState<Appointment | null>(null);
  const dates = daysBetween(DEMO_TODAY, addDays(DEMO_TODAY, 6));

  const { data } = useService(async () => {
    const [doctors, rooms, services, appointments] = await Promise.all([doctorsService.list(), roomsService.list(), doctorsService.services(), appointmentsService.byDate(date)]);
    return { doctors, rooms, services, appointments };
  }, [date]);

  if (!data) return <div className="h-[600px] animate-pulse rounded-[28px] bg-milk" />;
  const { doctors, rooms, services, appointments } = data;

  const rows: TimelineRow[] = [
    ...doctors.map((d) => {
      const st = doctorDayStatus(d, date);
      return {
        id: d.id,
        kind: "doctor" as const,
        label: `${d.lastName} ${d.firstName[0]}.${d.patronymic[0]}.`,
        sub: st === "on_shift" ? `${fmtRange(d.shiftStart, d.shiftEnd)} · ${d.specialties[0].toLowerCase()}` : DOCTOR_STATUS_LABEL[st],
        tone: st === "on_shift" ? undefined : ("muted" as const),
      };
    }),
    ...rooms.map((r) => ({ id: r.id, kind: "room" as const, label: `Кабинет №${r.number}`, sub: r.access === "personal" ? "персональный" : r.access === "group" ? "группа" : "общий" })),
  ];
  const offHours = Object.fromEntries(
    doctors.map((d) => [d.id, doctorDayStatus(d, date) === "on_shift" ? ([[0, d.shiftStart], [d.shiftEnd, 1440]] as [Minutes, Minutes][]) : ([[0, 1440]] as [Minutes, Minutes][])]),
  );

  const onCell = async (row: TimelineRow, minute: Minutes) => {
    if (row.kind === "doctor") {
      const d = doctors.find((x) => x.id === row.id)!;
      const serviceId = d.serviceIds.find((id) => services.find((s) => s.id === id)?.durationMin === 30) ?? d.serviceIds[0];
      const check = await appointmentsService.explain(d.id, serviceId, date, minute);
      setExplain({ row, check, minute });
    } else {
      setExplain({ row, minute });
    }
  };

  const demoCase = () => onCell(rows[0], 690);

  return (
    <>
      <AdminTitle
        title="Календарь рабочего дня"
        lead="Строки — врачи и кабинеты, столбцы — время. Нажмите на пустую клетку врача, чтобы проверить, можно ли записать пациента."
      />

      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {dates.map((d) => (
          <button
            key={d}
            onClick={() => { setDate(d); setExplain(null); }}
            className={`flex shrink-0 items-baseline gap-2 rounded-full px-4 py-2 text-sm transition ${d === date ? "bg-forest text-milk" : "bg-milk text-ink/70 hover:text-forest"}`}
          >
            <span className="font-semibold">{dayNum(d)}</span>
            <span className="text-xs opacity-70">{fmtWeekdayShort(d)}</span>
          </button>
        ))}
      </div>

      {date === DEMO_TODAY && (
        <div className="mb-6 grid gap-3 rounded-[24px] border border-line bg-milk p-4 sm:p-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex flex-wrap items-center gap-2 text-[13.5px]">
            <span className="rounded-full bg-forest px-3 py-1.5 text-milk">Орлова М.И. · 11:00–12:00 занята</span>
            <span className="rounded-full bg-sand px-3 py-1.5 text-ink/80">Кабинет №305 · 11:00–12:00 занят</span>
            <span className="rounded-full bg-ok-soft px-3 py-1.5 text-ok">Кабинет №201 · свободен</span>
            <span className="text-muted">→ новая запись к Марии Ивановне на 11:30 невозможна</span>
          </div>
          <Button size="sm" variant="secondary" onClick={demoCase}>
            <MousePointerClick size={15} /> Проверить 11:30
          </Button>
        </div>
      )}

      <AnimatePresence>
        {explain && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mb-6">
            <ExplainPanel explain={explain} appointments={appointments} doctors={doctors} rooms={rooms} services={services} onClose={() => setExplain(null)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-[28px] border border-line bg-milk p-4 sm:p-6">
        <Timeline
          rows={rows}
          appointments={appointments}
          from={WORKDAY_START}
          to={WORKDAY_END}
          doctors={doctors}
          services={services}
          offHours={offHours}
          onCellClick={onCell}
          onBlockClick={setOpen}
          sectionTitles={{ [doctors[0].id]: "Врачи", [rooms[0].id]: "Кабинеты" }}
          highlight={explain ? { start: explain.minute, end: explain.check?.end ?? explain.minute + 30, tone: explain.check ? (explain.check.available ? "ok" : "bad") : "neutral" } : null}
          labelWidth={170}
          rowHeight={46}
          minWidth={1000}
        />
      </div>

      <Modal open={!!open} onClose={() => setOpen(null)} title="Запись" wide>
        {open && <AppointmentDetails a={open} doctors={doctors} services={services} />}
      </Modal>
    </>
  );
}

function ExplainPanel({
  explain, appointments, doctors, rooms, services, onClose,
}: {
  explain: { row: TimelineRow; check?: SlotCheck; minute: Minutes };
  appointments: Appointment[];
  doctors: { id: string; lastName: string; firstName: string; patronymic: string; roomIds: string[] }[];
  rooms: { id: string; access: string; ownerDoctorId?: string }[];
  services: { id: string; title: string; durationMin: number }[];
  onClose: () => void;
}) {
  const { row, check, minute } = explain;
  if (!check) {
    const busy = appointments.find((a) => a.roomId === row.id && a.status !== "cancelled" && a.start <= minute && a.end > minute);
    const who = doctors.filter((d) => d.roomIds.includes(row.id));
    const room = rooms.find((r) => r.id === row.id)!;
    return (
      <div className="flex items-start justify-between gap-4 rounded-[24px] border border-line bg-milk p-5">
        <div>
          <div className="text-[15px] font-semibold text-forest-deep">
            {row.label} · {fmtTime(minute)} — {busy ? "занят" : "свободен"}
          </div>
          <p className="mt-1 text-sm text-muted">
            {room.access === "personal"
              ? "Персональный кабинет: назначается только закреплённому врачу."
              : `Может использоваться: ${who.map((d) => `${d.lastName} ${d.firstName[0]}.`).join(", ")}.`}{" "}
            Свободный кабинет сам по себе не даёт слот — нужен ещё свободный врач.
          </p>
        </div>
        <button onClick={onClose} aria-label="Закрыть" className="text-muted hover:text-forest"><X size={16} /></button>
      </div>
    );
  }
  const svc = services.find((s) => s.id === check.serviceId)!;
  return (
    <div className={`rounded-[24px] border p-5 ${check.available ? "border-ok/30 bg-ok-soft/40" : "border-danger/30 bg-danger-soft/50"}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          {check.available ? <CheckCircle2 className="shrink-0 text-ok" /> : <AlertTriangle className="shrink-0 text-danger" />}
          <div>
            <div className="text-[15.5px] font-semibold text-forest-deep">
              {row.label} · {fmtTime(minute)} · {svc.title}
            </div>
            <div className={`text-[14px] ${check.available ? "text-ok" : "text-danger"}`}>{check.summary}</div>
          </div>
        </div>
        <button onClick={onClose} aria-label="Закрыть" className="text-muted hover:text-forest"><X size={16} /></button>
      </div>
      <div className="mt-4 grid gap-2 text-[13px] sm:grid-cols-3">
        <Mini ok={check.shift.ok} title="Смена" text={check.shift.reason} />
        <Mini ok={check.doctor.ok} title="Врач" text={check.doctor.reason} />
        <Mini
          ok={check.rooms.some((r) => r.state === "free")}
          title="Кабинеты"
          text={check.rooms.filter((r) => r.state !== "not_equipped").map((r) => `№${r.roomId} ${r.state === "free" ? "свободен" : r.state === "busy" ? "занят" : "недоступен"}`).join(", ")}
        />
      </div>
    </div>
  );
}

function Mini({ ok, title, text }: { ok: boolean; title: string; text: string }) {
  return (
    <div className="flex gap-2 rounded-xl bg-milk/80 p-3">
      {ok ? <Check size={15} className="mt-0.5 shrink-0 text-ok" /> : <XCircle size={15} className="mt-0.5 shrink-0 text-danger" />}
      <div>
        <div className="font-semibold text-forest-deep">{title}</div>
        <div className="text-muted">{text}</div>
      </div>
    </div>
  );
}

function AppointmentDetails({ a, doctors, services }: { a: Appointment; doctors: { id: string; lastName: string; firstName: string; patronymic: string }[]; services: { id: string; title: string }[] }) {
  const d = doctors.find((x) => x.id === a.doctorId)!;
  const rows: [string, string][] = [
    ["Пациент", a.patientName],
    ["Врач", `${d.firstName} ${d.patronymic} ${d.lastName}`],
    ["Услуга", a.kind === "block" ? a.note ?? "—" : services.find((s) => s.id === a.serviceId)?.title ?? "—"],
    ["Дата и время", `${fmtDay(a.date)}, ${fmtRange(a.start, a.end)}`],
    ["Кабинет", a.roomId ? `№${a.roomId} (назначен системой)` : "—"],
    ["Создана", a.createdVia === "online" ? "онлайн-запись" : a.createdVia === "mis" ? "в МИС администратором" : "по телефону"],
    ["ID записи в МИС", a.misId ?? "—"],
  ];
  return (
    <div>
      <dl className="divide-y divide-line">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 py-2.5 text-[14.5px]">
            <dt className="text-muted">{k}</dt>
            <dd className="text-right font-medium text-forest-deep">{v}</dd>
          </div>
        ))}
      </dl>
      {a.attribution ? (
        <div className="mt-6">
          <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">Источник записи</div>
          <AttributionTable a={a.attribution} />
        </div>
      ) : (
        <p className="mt-6 rounded-2xl bg-cream p-4 text-sm text-muted">Запись создана не через онлайн-запись — источник не отслеживается.</p>
      )}
    </div>
  );
}
