"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, Lock, RotateCcw, X, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Appointment, Doctor, Minutes, Service, SlotCheck } from "@/lib/types";
import { checkSlot, findSlots } from "@/lib/scheduling/engine";
import { fmtRange, fmtTime } from "@/lib/time";
import { useService } from "@/hooks/useService";
import { appointmentsService, doctorsService, roomsService } from "@/services";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { DoctorPortrait } from "@/components/brand/DoctorPortrait";
import { Timeline, type TimelineRow } from "@/components/schedule/Timeline";

type CaseId = "example-1" | "busy-doctor" | "example-2" | "example-3" | "sandbox";

interface Case {
  id: CaseId;
  tag: string;
  title: string;
  doctorId: string;
  serviceId: string;
  start: Minutes;
  window: [Minutes, Minutes];
  /** Учитывать запись из Примера №1 (Орлова, №305, 11:00) */
  withExample: boolean;
  contextDoctors?: string[];
  story: string;
}

const CASES: Case[] = [
  {
    id: "example-1", tag: "Пример 1", title: "Кабинет подобран автоматически",
    doctorId: "orlova", serviceId: "cosm-hardware", start: 660, window: [540, 840], withExample: false,
    story: "Пациент выбирает Марию Ивановну Орлову, аппаратную косметологическую процедуру (60 минут) на 11:00. Процедуру можно провести только в кабинетах №305 или №307.",
  },
  {
    id: "busy-doctor", tag: "Особо важно", title: "Свободный кабинет ≠ свободный врач",
    doctorId: "orlova", serviceId: "cosm-consult", start: 690, window: [540, 840], withExample: true,
    story: "Мария Ивановна уже записана на 11:00 в кабинет №305. Новый пациент хочет попасть к ней на 11:30. Её основной кабинет №201 в это время свободен.",
  },
  {
    id: "example-2", tag: "Пример 2", title: "Конфликт по кабинету",
    doctorId: "belova", serviceId: "physio-hardware", start: 780, window: [660, 960], withExample: true, contextDoctors: ["volkova"],
    story: "В 13:00 Зинаида Петровна Волкова проводит процедуру в кабинете №307. Ирина Андреевна Белова свободна и тоже может работать в №307 — но кабинет занят.",
  },
  {
    id: "example-3", tag: "Пример 3", title: "Нет свободного кабинета",
    doctorId: "morozov", serviceId: "reflexo", start: 900, window: [780, 1080], withExample: true,
    story: "Алексей Сергеевич Морозов свободен в 15:00. Рефлексотерапию можно проводить только в №410 и №412. Оба кабинета в это время заняты другими врачами.",
  },
  {
    id: "sandbox", tag: "Попробуйте сами", title: "Свой пример",
    doctorId: "orlova", serviceId: "ther-primary", start: 600, window: [540, 1140], withExample: true,
    story: "Выберите врача, услугу и время — система покажет, как она принимает решение.",
  },
];

export function LogicExplorer() {
  const params = useSearchParams();
  const router = useRouter();
  const initial = (CASES.find((c) => c.id === params.get("case"))?.id ?? "example-1") as CaseId;
  const [caseId, setCaseId] = useState<CaseId>(initial);
  const [run, setRun] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [sandbox, setSandbox] = useState({ doctorId: "orlova", serviceId: "ther-primary", start: 690, withExample: true });

  const { data } = useService(async () => {
    const [doctors, services, rooms, ref] = await Promise.all([doctorsService.list(), doctorsService.services(), roomsService.list(), appointmentsService.referenceDay()]);
    return { doctors, services, rooms, ref };
  }, []);

  const c = CASES.find((x) => x.id === caseId)!;
  const params2 = caseId === "sandbox" ? { ...c, ...sandbox } : c;

  const select = (id: CaseId) => {
    setCaseId(id);
    setConfirmed(false);
    setRun((r) => r + 1);
    router.replace(`/logic?case=${id}`, { scroll: false });
  };

  const computed = useMemo(() => {
    if (!data) return null;
    const { doctors, services, rooms, ref } = data;
    const example = ref.appointments.find((a) => a.id === ref.exampleId)!;
    // Проверка всегда идёт по состоянию «до записи»; после подтверждения меняется только расписание на экране
    const before = ref.appointments.filter((a) => a.id !== ref.exampleId || params2.withExample);
    const appointments = caseId === "example-1" && confirmed ? ref.appointments : before;
    const ctx = { doctors, services, rooms, appointments: before };
    const check = checkSlot(ctx, params2.doctorId, params2.serviceId, ref.date, params2.start);
    const next = check.available ? null : findSlots(ctx, params2.doctorId, params2.serviceId, ref.date, { from: params2.start })[0] ?? null;
    const patientView = findSlots(ctx, params2.doctorId, params2.serviceId, ref.date);
    return { check, next, appointments, example, date: ref.date, patientView };
  }, [data, params2.doctorId, params2.serviceId, params2.start, params2.withExample, caseId, confirmed]);

  if (!data || !computed) return <div className="mx-auto mt-12 h-[600px] max-w-7xl animate-pulse rounded-[32px] bg-cream/60" />;

  const { doctors, services } = data;
  const { check } = computed;
  const doctor = doctors.find((d) => d.id === params2.doctorId)!;
  const service = services.find((s) => s.id === params2.serviceId)!;

  const relevantRooms = check.rooms.filter((r) => r.state !== "not_equipped" || r.roomId === doctor.mainRoomId);
  const rows: TimelineRow[] = [
    ...(c.contextDoctors ?? []).map((id) => {
      const d = doctors.find((x) => x.id === id)!;
      return { id, kind: "doctor" as const, label: `${d.lastName} ${d.firstName[0]}.${d.patronymic[0]}.`, sub: "другой врач", tone: "muted" as const };
    }),
    { id: doctor.id, kind: "doctor", label: `${doctor.lastName} ${doctor.firstName[0]}.${doctor.patronymic[0]}.`, sub: check.doctor.ok ? "врач свободен" : "врач занят", tone: check.doctor.ok ? "ok" : "bad" },
    ...relevantRooms.map((r) => ({
      id: r.roomId,
      kind: "room" as const,
      label: `Кабинет №${r.roomId}`,
      sub: r.state === "not_equipped" ? "основной · не для этой услуги" : r.roomId === doctor.mainRoomId ? `основной · ${roomStateLabel(r.state)}` : roomStateLabel(r.state),
      tone: (r.state === "free" ? "ok" : r.state === "busy" ? "bad" : "muted") as TimelineRow["tone"],
    })),
  ];

  const newIds = caseId === "example-1" && confirmed ? [computed.example.id] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8">
      {/* выбор сценария */}
      <div className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {CASES.map((x) => (
          <button
            key={x.id}
            onClick={() => select(x.id)}
            className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition ${
              x.id === caseId ? "border-forest bg-forest text-milk shadow-[var(--shadow-soft)]" : "border-line bg-milk hover:border-teal/40"
            }`}
          >
            <div className={`text-[10.5px] font-semibold uppercase tracking-[0.16em] ${x.id === caseId ? "text-gold" : x.id === "busy-doctor" ? "text-danger" : "text-teal"}`}>{x.tag}</div>
            <div className="mt-1 text-[14px] font-medium">{x.title}</div>
          </button>
        ))}
      </div>

      <Formula check={check} runKey={`${caseId}-${run}-${params2.start}-${params2.serviceId}-${params2.doctorId}`} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr]">
        {/* запрос + проверка */}
        <div className="space-y-5">
          <div className="rounded-[28px] border border-line bg-milk p-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">Запрос пациента</div>
            {caseId === "sandbox" ? (
              <Sandbox doctors={doctors} services={services} value={sandbox} onChange={(v) => { setSandbox(v); setRun((r) => r + 1); }} />
            ) : (
              <>
                <div className="mt-4 flex gap-4">
                  <DoctorPortrait doctor={doctor} className="aspect-[4/5] w-16 shrink-0" rounded="rounded-xl" />
                  <div>
                    <div className="font-display text-[22px] leading-tight text-forest-deep">
                      {doctor.firstName} {doctor.patronymic} {doctor.lastName}
                    </div>
                    <div className="mt-1 text-sm text-muted">{service.title}</div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  <Pill label="Дата" value="12 окт" />
                  <Pill label="Время" value={fmtTime(params2.start)} />
                  <Pill label="Длительность" value={`${service.durationMin} мин`} />
                </div>
                <p className="mt-5 text-[14px] leading-relaxed text-muted">{c.story}</p>
              </>
            )}
          </div>

          <CheckList key={`${caseId}-${run}-${JSON.stringify(sandbox)}`} check={check} doctor={doctor} service={service} doctors={doctors} />
        </div>

        {/* визуализация */}
        <div className="min-w-0 space-y-5">
          <div className="rounded-[28px] border border-line bg-milk p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">Расписание 12 октября</div>
                <div className="mt-1 text-sm text-muted">Врач и кабинеты, которые подходят для услуги</div>
              </div>
              <Legend />
            </div>
            <Timeline
              rows={rows}
              appointments={computed.appointments}
              from={caseId === "sandbox" ? Math.min(c.window[0], params2.start - 60) : c.window[0]}
              to={caseId === "sandbox" ? Math.max(c.window[1], params2.start + 120) : c.window[1]}
              doctors={doctors}
              services={services}
              newIds={newIds}
              highlight={
                caseId === "example-1" && confirmed
                  ? null
                  : { start: check.start, end: check.end, tone: check.available ? "ok" : "bad", label: check.available ? `${fmtTime(check.start)} доступно` : `${fmtTime(check.start)} недоступно` }
              }
              offHours={{ [doctor.id]: [[0, doctor.shiftStart], [doctor.shiftEnd, 24 * 60]] }}
              labelWidth={150}
            />
          </div>

          <Outcome
            caseId={caseId}
            check={check}
            confirmed={confirmed}
            next={computed.next?.start ?? null}
            patientView={computed.patientView.map((s) => s.start)}
            doctor={doctor}
            onConfirm={() => setConfirmed(true)}
            onReset={() => setConfirmed(false)}
            onGo={select}
          />
        </div>
      </div>
    </div>
  );
}

const roomStateLabel = (s: SlotCheck["rooms"][number]["state"]) =>
  s === "free" ? "свободен" : s === "busy" ? "занят" : s === "not_allowed" ? "недоступен врачу" : "не для этой услуги";

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream/70 px-2 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-0.5 text-[15px] font-semibold text-forest-deep">{value}</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-3 text-[11px] text-muted">
      <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded bg-forest" /> врач занят</span>
      <span className="flex items-center gap-1.5"><span className="hatch h-3 w-5 rounded border border-linen bg-sand" /> кабинет занят</span>
      <span className="flex items-center gap-1.5"><span className="hatch h-3 w-5 rounded" /> вне смены</span>
    </div>
  );
}

/* ---------- формула ---------- */

function Formula({ check, runKey }: { check: SlotCheck; runKey: string }) {
  const eligible = check.rooms.some((r) => r.state === "free" || r.state === "busy");
  const free = check.rooms.some((r) => r.state === "free");
  const items = [
    { label: "Врач", ok: check.doctor.ok, hint: "свободен ли в это время" },
    { label: "Услуга", ok: true, hint: "длительность и оборудование" },
    { label: "Рабочая смена", ok: check.shift.ok, hint: "работает ли врач" },
    { label: "Кабинет", ok: eligible, hint: "где разрешено работать" },
    { label: "Занятость кабинета", ok: free, hint: "не занят ли другим" },
  ];
  return (
    <div key={runKey} className="mt-6 flex flex-wrap items-stretch gap-2 rounded-[28px] bg-forest-deep p-4 sm:p-5">
      {items.map((it, i) => (
        <div key={it.label} className="flex items-center gap-2">
          <motion.div
            initial={{ backgroundColor: "rgba(250,248,243,0.06)", borderColor: "rgba(250,248,243,0.15)" }}
            animate={{
              backgroundColor: it.ok ? "rgba(79,127,91,0.35)" : "rgba(181,87,75,0.45)",
              borderColor: it.ok ? "rgba(203,214,195,0.5)" : "rgba(246,225,220,0.6)",
            }}
            transition={{ delay: 0.2 + i * 0.35, duration: 0.4 }}
            className="rounded-2xl border px-3 py-2 text-milk"
          >
            <div className="flex items-center gap-1.5 text-[14px] font-medium">
              <motion.span initial={{ scale: 0, width: 0 }} animate={{ scale: 1, width: "auto" }} transition={{ delay: 0.2 + i * 0.35 }}>
                {it.ok ? <Check size={14} className="text-sage" /> : <X size={14} className="text-[#f6c9c0]" />}
              </motion.span>
              {it.label}
            </div>
            <div className="hidden text-[11px] text-sage/80 sm:block">{it.hint}</div>
          </motion.div>
          <span className="text-lg text-gold">{i < items.length - 1 ? "+" : "="}</span>
        </div>
      ))}
      <motion.div
        initial={{ opacity: 0.3, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 + items.length * 0.35 }}
        className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-[15px] font-semibold ${check.available ? "bg-gold text-forest-deep" : "bg-danger text-milk"}`}
      >
        {check.available ? <CheckCircle2 size={17} /> : <XCircle size={17} />}
        {check.available ? "Время доступно" : "Время не показывается"}
      </motion.div>
    </div>
  );
}

/* ---------- пошаговая проверка ---------- */

function CheckList({ check, doctor, service, doctors }: { check: SlotCheck; doctor: Doctor; service: Service; doctors: Doctor[] }) {
  const candidates = check.rooms.filter((r) => r.state !== "not_equipped");
  const who = (a?: Appointment) => {
    if (!a) return "";
    const d = doctors.find((x) => x.id === a.doctorId);
    return d ? `${d.lastName} ${d.firstName[0]}.${d.patronymic[0]}.` : "";
  };
  const steps: { title: string; ok: boolean; body: React.ReactNode }[] = [
    { title: "Врач и услуга", ok: true, body: `${doctor.lastName} ${doctor.firstName[0]}.${doctor.patronymic[0]}. проводит «${service.title}» — ${service.durationMin} мин` },
    { title: "Рабочая смена", ok: check.shift.ok, body: check.shift.reason },
    { title: "Врач свободен?", ok: check.doctor.ok, body: check.doctor.reason },
    {
      title: "Подходящие кабинеты",
      ok: candidates.some((r) => r.state !== "not_allowed"),
      body: candidates.length ? candidates.map((r) => `№${r.roomId}`).join(", ") + (candidates.some((r) => r.state === "not_allowed") ? " (часть недоступна врачу)" : "") : "Нет кабинетов для этой услуги",
    },
    {
      title: "Занятость кабинетов",
      ok: candidates.some((r) => r.state === "free"),
      body: (
        <ul className="space-y-1">
          {candidates.map((r) => (
            <li key={r.roomId} className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${r.state === "free" ? "bg-ok" : "bg-danger"}`} />
              №{r.roomId} — {r.state === "busy" ? `занят (${who(r.busyBy)}, ${fmtRange(r.busyBy!.start, r.busyBy!.end)})` : r.state === "free" ? "свободен" : r.reason.toLowerCase()}
            </li>
          ))}
        </ul>
      ),
    },
  ];

  return (
    <div className="rounded-[28px] border border-line bg-milk p-6">
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">Как проверяет система</div>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <motion.li key={s.title} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.35 }} className="flex gap-3">
            <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.ok ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`}>
              {s.ok ? <Check size={13} strokeWidth={2.5} /> : <X size={13} strokeWidth={2.5} />}
            </span>
            <div className="min-w-0 text-[13.5px] leading-relaxed">
              <div className="font-semibold text-forest-deep">{s.title}</div>
              <div className="text-muted">{s.body}</div>
            </div>
          </motion.li>
        ))}
      </ol>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + steps.length * 0.35 }}
        className={`mt-5 rounded-2xl p-4 text-[14px] font-medium leading-snug ${check.available ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`}
      >
        {check.summary}
      </motion.div>
    </div>
  );
}

/* ---------- итог сценария ---------- */

function Outcome({
  caseId, check, confirmed, next, patientView, doctor, onConfirm, onReset, onGo,
}: {
  caseId: CaseId; check: SlotCheck; confirmed: boolean; next: Minutes | null; patientView: Minutes[]; doctor: Doctor;
  onConfirm: () => void; onReset: () => void; onGo: (id: CaseId) => void;
}) {
  if (caseId === "example-1") {
    return (
      <AnimatePresence mode="wait">
        {!confirmed ? (
          <motion.div key="pre" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4 rounded-[28px] bg-cream/70 p-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[15px] leading-relaxed text-ink/80">
              <b className="text-forest-deep">11:00 доступно.</b> №307 занят, поэтому система сама назначает №305. Пациент кабинет не выбирает.
            </p>
            <Button onClick={onConfirm} className="shrink-0">
              <Lock size={16} /> Подтвердить запись
            </Button>
          </motion.div>
        ) : (
          <motion.div key="post" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] bg-forest-deep p-6 text-milk sm:p-7">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Запись подтверждена</div>
            <div className="font-display mt-3 text-3xl leading-tight">С 11:00 до 12:00 одновременно заблокированы</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-2xl bg-milk/10 p-4">
                <Lock size={18} className="text-gold" /> Мария Ивановна Орлова
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-milk/10 p-4">
                <Lock size={18} className="text-gold" /> Кабинет №305
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="gold" onClick={() => onGo("busy-doctor")}>
                Записать к ней же на 11:30? <ArrowRight size={16} />
              </Button>
              <Button variant="light" onClick={onReset}>
                <RotateCcw size={15} /> Повторить
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  if (caseId === "busy-doctor") {
    return (
      <div className="space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2 }}
          className="flex items-center gap-3 rounded-2xl border border-danger/30 bg-danger-soft p-4 text-[15px] font-medium text-danger shadow-[var(--shadow-soft)]"
        >
          <AlertTriangle size={18} /> Врач занят в это время в другом кабинете
        </motion.div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-[24px] border border-ok/30 bg-ok-soft/60 p-5">
            <div className="text-sm text-ok">Кабинет №201</div>
            <div className="font-display mt-1 text-3xl text-forest-deep">свободен</div>
          </div>
          <div className="rounded-[24px] border border-danger/30 bg-danger-soft/60 p-5">
            <div className="text-sm text-danger">{doctor.firstName} {doctor.patronymic}</div>
            <div className="font-display mt-1 text-3xl text-forest-deep">занята</div>
          </div>
        </div>
        <div className="rounded-[28px] bg-forest-deep p-6 text-milk sm:p-7">
          <div className="font-display text-[30px] leading-tight">Свободный кабинет не означает свободного врача</div>
          <p className="mt-3 text-[15px] leading-relaxed text-sage">
            Если смотреть только на кабинеты, система записала бы пациента к Марии Ивановне в №201 — и врач оказалась бы одновременно в двух местах. Поэтому каждая проверка начинается с занятости самого врача.
          </p>
          {next !== null && <p className="mt-4 text-sm text-gold">Ближайшее время у Марии Ивановны для этой услуги: {fmtTime(next)}</p>}
        </div>
      </div>
    );
  }

  if (caseId === "example-2") {
    return (
      <div className="rounded-[28px] bg-cream/70 p-6 sm:p-7">
        <div className="font-display text-[28px] leading-tight text-forest-deep">Система предлагает запись в №{check.assignedRoomId}</div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
          №307 занят Зинаидой Петровной, поэтому система проверила другие кабинеты, разрешённые Ирине Андреевне, и нашла свободный. Пациент видит просто «13:00» — <b>выбирать кабинет ему не нужно</b>.
        </p>
      </div>
    );
  }

  if (caseId === "example-3") {
    return (
      <div className="space-y-4">
        <div className="rounded-[28px] bg-cream/70 p-6 sm:p-7">
          <div className="font-display text-[28px] leading-tight text-forest-deep">15:00 пациенту не показывается</div>
          <p className="mt-3 text-[15px] leading-relaxed text-ink/75">
            Врач свободен, но для процедуры нет ни одного свободного кабинета: №410 занят Марией Ивановной, №412 — Ириной Андреевной.
          </p>
          {next !== null && (
            <p className="mt-4 text-[15px]">
              Ближайшее доступное время: <b className="text-forest-deep">{fmtTime(next)}</b>
            </p>
          )}
        </div>
        <PatientView times={patientView} />
      </div>
    );
  }

  return <PatientView times={patientView} />;
}

function PatientView({ times }: { times: Minutes[] }) {
  return (
    <div className="rounded-[28px] border border-line bg-milk p-6">
      <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">Так видит пациент</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {times.length ? (
          times.map((t) => (
            <span key={t} className="rounded-xl border border-line px-3 py-2 text-sm font-semibold tabular-nums text-forest-deep">
              {fmtTime(t)}
            </span>
          ))
        ) : (
          <span className="text-sm text-muted">Свободного времени на этот день нет</span>
        )}
      </div>
      <p className="mt-4 text-xs text-muted">Только время. Без кабинетов и без занятых интервалов.</p>
    </div>
  );
}

/* ---------- песочница ---------- */

function Sandbox({
  doctors, services, value, onChange,
}: {
  doctors: Doctor[]; services: Service[];
  value: { doctorId: string; serviceId: string; start: number; withExample: boolean };
  onChange: (v: { doctorId: string; serviceId: string; start: number; withExample: boolean }) => void;
}) {
  const doctor = doctors.find((d) => d.id === value.doctorId)!;
  const own = services.filter((s) => doctor.serviceIds.includes(s.id));
  const times: number[] = [];
  for (let t = 540; t <= 1110; t += 30) times.push(t);
  const sel = "h-11 w-full rounded-xl border border-line bg-milk px-3 text-[14px] outline-none focus:border-teal";
  return (
    <div className="mt-4 space-y-3">
      <label className="block text-xs text-muted">
        Врач
        <select className={sel} value={value.doctorId} onChange={(e) => {
          const d = doctors.find((x) => x.id === e.target.value)!;
          onChange({ ...value, doctorId: d.id, serviceId: d.serviceIds[0], start: Math.max(value.start, d.shiftStart) });
        }}>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>{d.firstName} {d.patronymic} {d.lastName}</option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted">
        Услуга
        <select className={sel} value={value.serviceId} onChange={(e) => onChange({ ...value, serviceId: e.target.value })}>
          {own.map((s) => (
            <option key={s.id} value={s.id}>{s.title} · {s.durationMin} мин</option>
          ))}
        </select>
      </label>
      <label className="block text-xs text-muted">
        Время, 12 октября
        <select className={sel} value={value.start} onChange={(e) => onChange({ ...value, start: Number(e.target.value) })}>
          {times.map((t) => (
            <option key={t} value={t}>{fmtTime(t)}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-between gap-3 pt-1 text-[13px] text-ink/80">
        Учитывать запись Орловой в №305 на 11:00
        <Toggle checked={value.withExample} onChange={(v) => onChange({ ...value, withExample: v })} label="Учитывать запись из примера 1" />
      </div>
    </div>
  );
}
