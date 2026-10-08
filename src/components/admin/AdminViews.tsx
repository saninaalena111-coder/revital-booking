"use client";

import { motion } from "framer-motion";
import { ArrowRight, BellRing, CalendarCheck, CheckCircle2, Clock, Database, DoorOpen, Loader2, MessageSquare, RefreshCw, Webhook, XCircle } from "lucide-react";
import { useState } from "react";
import type { Appointment, Attribution, Room } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { analyticsService, appointmentsService, doctorsService, integrationService, roomsService, smsTemplates } from "@/services";
import type { AttributedRow } from "@/services/analyticsService";
import { canUseRoom, doctorDayStatus, DOCTOR_STATUS_LABEL } from "@/lib/scheduling/engine";
import { addDays, dayNum, DEMO_TODAY, daysBetween, fmtRange, fmtWeekdayShort, toMin, WORKDAY_END, WORKDAY_START } from "@/lib/time";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DoctorPortrait } from "@/components/brand/DoctorPortrait";
import { Timeline } from "@/components/schedule/Timeline";
import { AdminTitle } from "./AdminShell";

const card = "rounded-[24px] border border-line bg-milk";
const SOURCE_COLORS = ["#2f5451", "#598988", "#d0ab67", "#cbd6c3"];

/* =============== ОБЗОР =============== */

export function Overview({ onOpen }: { onOpen: (tab: "calendar" | "sources" | "sms" | "integration") => void }) {
  const { data } = useService(async () => {
    const [stats, rows, doctors] = await Promise.all([analyticsService.dashboard(), analyticsService.attributed(), doctorsService.list()]);
    return { stats, rows, doctors };
  }, []);
  if (!data) return null;
  const { stats, rows, doctors } = data;
  const total = stats.bySource.reduce((s, x) => s + x.value, 0);
  const maxWeek = Math.max(...stats.week);
  const weekDays = daysBetween(addDays(DEMO_TODAY, -6), DEMO_TODAY);

  return (
    <>
      <AdminTitle title="Дашборд" lead="Главные показатели медицинского центра за день. Цифры демонстрационные, на 12 октября." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Записей сегодня" value={stats.today} accent icon={<CalendarCheck size={18} />} />
        <Kpi label="Подтверждено" value={stats.confirmed} icon={<CheckCircle2 size={18} />} />
        <Kpi label="Отменено" value={stats.cancelled} icon={<XCircle size={18} />} />
        <Kpi label="Ожидают визита" value={stats.awaiting} icon={<Clock size={18} />} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <div className={`${card} p-6`}>
          <div className="flex items-baseline justify-between">
            <div className="text-[15px] font-semibold text-forest-deep">Откуда пришли записи</div>
            <button onClick={() => onOpen("sources")} className="text-sm text-teal hover:underline">Подробнее</button>
          </div>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full">
            {stats.bySource.map((s, i) => (
              <motion.div key={s.label} initial={{ width: 0 }} animate={{ width: `${(s.value / total) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.7 }} style={{ background: SOURCE_COLORS[i] }} className="h-full border-r-2 border-milk last:border-0" />
            ))}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {stats.bySource.map((s, i) => (
              <div key={s.label}>
                <div className="flex items-center gap-2 text-[13px] text-muted">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: SOURCE_COLORS[i] }} /> {s.label}
                </div>
                <div className="font-display mt-1 text-4xl text-forest-deep">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${card} p-6`}>
          <div className="text-[15px] font-semibold text-forest-deep">Записи за неделю</div>
          <div className="mt-6 flex h-36 items-end gap-3">
            {stats.week.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <span className="text-[11px] tabular-nums text-muted">{v}</span>
                <motion.div initial={{ height: 0 }} animate={{ height: `${(v / maxWeek) * 100}%` }} transition={{ delay: i * 0.06, duration: 0.6 }} className={`w-full rounded-t-lg ${i === 6 ? "bg-forest" : "bg-sage"}`} />
                <span className="text-[11px] text-muted">{fmtWeekdayShort(weekDays[i])}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`${card} mt-4 p-6`}>
        <div className="mb-4 flex items-baseline justify-between">
          <div className="text-[15px] font-semibold text-forest-deep">Последние онлайн-записи</div>
          <button onClick={() => onOpen("calendar")} className="inline-flex items-center gap-1 text-sm text-teal hover:underline">
            Календарь <ArrowRight size={14} />
          </button>
        </div>
        <div className="divide-y divide-line">
          {rows.slice(0, 6).map((r) => {
            const d = doctors.find((x) => x.id === r.doctorId)!;
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-[14px]">
                <span className="w-32 shrink-0 font-medium text-forest-deep">{r.patient}</span>
                <span className="min-w-0 flex-1 truncate text-muted">{d.lastName} · {r.service}</span>
                <span className="text-muted tabular-nums">{r.when}</span>
                <Badge tone={r.fresh ? "gold" : "sage"}>{r.fresh ? "новая · " : ""}{r.a.source}</Badge>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <QuickCard icon={<MessageSquare size={18} />} title="СМС-напоминания" text="Цепочка сообщений после записи, за сутки и за 2 часа" onClick={() => onOpen("sms")} />
        <QuickCard icon={<RefreshCw size={18} />} title="Обмен данными с МИС" text="Как система узнаёт о переносах и отменах в «Санаториуме»" onClick={() => onOpen("integration")} />
      </div>
    </>
  );
}

function Kpi({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: boolean }) {
  return (
    <div className={`rounded-[24px] p-6 ${accent ? "bg-forest-deep text-milk" : card}`}>
      <div className={`flex items-center justify-between text-[13px] ${accent ? "text-sage" : "text-muted"}`}>
        {label} <span className={accent ? "text-gold" : "text-teal"}>{icon}</span>
      </div>
      <div className={`font-display mt-3 text-6xl leading-none ${accent ? "" : "text-forest-deep"}`}>{value}</div>
    </div>
  );
}

function QuickCard({ icon, title, text, onClick }: { icon: React.ReactNode; title: string; text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`${card} group flex items-center gap-4 p-5 text-left transition hover:shadow-[var(--shadow-soft)]`}>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-sage-soft text-forest">{icon}</span>
      <span className="flex-1">
        <span className="block text-[15px] font-semibold text-forest-deep">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
      <ArrowRight size={16} className="text-forest transition group-hover:translate-x-1" />
    </button>
  );
}

/* =============== ВРАЧИ =============== */

const WEEK = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const STATUS_TONE = { on_shift: "ok", off_shift: "neutral", vacation: "gold", sick: "danger" } as const;

export function DoctorsView() {
  const { data } = useService(async () => {
    const [doctors, services, rooms] = await Promise.all([doctorsService.list(), doctorsService.services(), roomsService.list()]);
    return { doctors, services, rooms };
  }, []);
  const [sel, setSel] = useState("orlova");
  if (!data) return null;
  const d = data.doctors.find((x) => x.id === sel)!;
  const status = doctorDayStatus(d, DEMO_TODAY);
  const week = daysBetween(DEMO_TODAY, addDays(DEMO_TODAY, 13));

  return (
    <>
      <AdminTitle title="Врачи" lead="Карточка врача: специализации, смены, кабинеты и услуги. В рабочей версии эти данные приходят из МИС «Санаториум»." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        <div className={`${card} h-fit p-2`}>
          {data.doctors.map((x) => {
            const st = doctorDayStatus(x, DEMO_TODAY);
            return (
              <button key={x.id} onClick={() => setSel(x.id)} className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${x.id === sel ? "bg-sage-soft" : "hover:bg-cream/60"}`}>
                <DoctorPortrait doctor={x} className="h-11 w-11 shrink-0" rounded="rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-medium text-forest-deep">{x.lastName} {x.firstName[0]}.{x.patronymic[0]}.</div>
                  <div className="truncate text-xs text-muted">{x.specialties.join(", ")}</div>
                </div>
                <span className={`h-2 w-2 rounded-full ${st === "on_shift" ? "bg-ok" : st === "sick" ? "bg-danger" : st === "vacation" ? "bg-gold" : "bg-linen"}`} />
              </button>
            );
          })}
        </div>

        <motion.div key={d.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${card} min-w-0 p-6 sm:p-8`}>
          <div className="flex flex-col gap-6 sm:flex-row">
            <DoctorPortrait doctor={d} className="aspect-[4/5] w-36 shrink-0" />
            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-display text-4xl leading-tight text-forest-deep">{d.firstName} {d.patronymic} {d.lastName}</h2>
                <Badge tone={STATUS_TONE[status]}>{DOCTOR_STATUS_LABEL[status]}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {d.specialties.map((s) => <Badge key={s} tone="sage">{s}</Badge>)}
              </div>
              <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{d.about}</p>
              <div className="mt-3 text-xs text-muted">Номер врача в МИС: {d.misId.replace(/^\D+/, "")}</div>
            </div>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Block title="Рабочие дни и смена">
              <div className="flex gap-1.5">
                {WEEK.map((w, i) => (
                  <span key={w} className={`grid h-9 w-9 place-items-center rounded-xl text-[12.5px] ${d.workDays.includes(i + 1) ? "bg-forest text-milk" : "bg-cream text-muted"}`}>{w}</span>
                ))}
              </div>
              <div className="mt-3 text-[14px] text-ink/80">Смена {fmtRange(d.shiftStart, d.shiftEnd)}</div>
            </Block>
            <Block title="Кабинеты">
              <div className="flex flex-wrap gap-2">
                {d.mainRoomId ? (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-forest px-3 py-1.5 text-[13px] text-milk"><DoorOpen size={13} /> №{d.mainRoomId} · основной</span>
                ) : (
                  <span className="rounded-xl bg-gold-soft px-3 py-1.5 text-[13px] text-[#7a5a1c]">Нет основного кабинета</span>
                )}
                {d.roomIds.filter((r) => r !== d.mainRoomId).map((r) => (
                  <span key={r} className="rounded-xl border border-line px-3 py-1.5 text-[13px] text-ink/80">№{r} · доп.</span>
                ))}
              </div>
            </Block>
          </div>

          <Block title="Статус на ближайшие две недели" className="mt-6">
            <div className="scrollbar-none flex gap-1.5 overflow-x-auto pb-1">
              {week.map((day) => {
                const st = doctorDayStatus(d, day);
                return (
                  <div key={day} title={DOCTOR_STATUS_LABEL[st]} className={`flex w-12 shrink-0 flex-col items-center rounded-xl py-2 text-[11px] ${st === "on_shift" ? "bg-ok-soft text-ok" : st === "sick" ? "bg-danger-soft text-danger" : st === "vacation" ? "bg-gold-soft text-[#7a5a1c]" : "bg-cream text-muted"}`}>
                    <span className="font-semibold">{dayNum(day)}</span>
                    <span>{fmtWeekdayShort(day)}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11.5px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ok" />На смене</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-linen" />Не на смене</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" />Отпуск</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-danger" />Больничный</span>
            </div>
          </Block>

          <Block title="Доступные услуги" className="mt-6">
            <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
              {data.services.filter((s) => d.serviceIds.includes(s.id)).map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 px-4 py-3 text-[14px]">
                  <span className="text-forest-deep">{s.title}</span>
                  <span className="shrink-0 text-muted">{s.durationMin} мин · каб. {s.roomIds.filter((r) => d.roomIds.includes(r)).map((r) => `№${r}`).join(", ")}</span>
                </div>
              ))}
            </div>
          </Block>
        </motion.div>
      </div>
    </>
  );
}

function Block({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">{title}</div>
      {children}
    </div>
  );
}

/* =============== КАБИНЕТЫ =============== */

const ROOM_TYPE: Record<Room["access"], { label: string; text: string; tone: "forest" | "gold" | "sage" }> = {
  personal: { label: "Персональный", text: "Закреплён за одним врачом. Другим не назначается, даже если свободен.", tone: "forest" },
  group: { label: "Специализированный", text: "Ограничен группой специалистов.", tone: "gold" },
  shared: { label: "Общий", text: "Доступен любому врачу, которому разрешена услуга в этом кабинете.", tone: "sage" },
};

export function RoomsView() {
  const { data } = useService(async () => {
    const [rooms, doctors, services, appointments] = await Promise.all([roomsService.list(), doctorsService.list(), doctorsService.services(), appointmentsService.byDate(DEMO_TODAY)]);
    return { rooms, doctors, services, appointments };
  }, []);
  const [sel, setSel] = useState("305");
  if (!data) return null;
  const room = data.rooms.find((r) => r.id === sel)!;
  const users = data.doctors.filter((d) => d.roomIds.includes(room.id) && canUseRoom(room, d.id).ok);
  const procedures = data.services.filter((s) => s.roomIds.includes(room.id));
  const t = ROOM_TYPE[room.access];

  return (
    <>
      <AdminTitle title="Кабинеты" lead="Режим доступа, специалисты, процедуры и занятость. Пациенту кабинет при записи не показывается." />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 xl:grid-cols-11">
        {data.rooms.map((r) => (
          <button key={r.id} onClick={() => setSel(r.id)} className={`rounded-2xl border p-3 text-left transition ${r.id === sel ? "border-forest bg-forest text-milk" : "border-line bg-milk hover:border-teal/40"}`}>
            <div className="font-display text-2xl leading-none">№{r.number}</div>
            <div className={`mt-1.5 text-[10.5px] ${r.id === sel ? "text-sage" : "text-muted"}`}>{ROOM_TYPE[r.access].label}</div>
          </button>
        ))}
      </div>

      <motion.div key={room.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`${card} mt-4 p-6 sm:p-8`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-5xl text-forest-deep">Кабинет №{room.number}</h2>
            <div className="mt-1 text-muted">{room.title} · {room.floor} этаж</div>
          </div>
          <Badge tone={t.tone}>{t.label}</Badge>
        </div>
        <p className="mt-4 text-[14.5px] text-ink/75">{t.text}</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <Block title="Кто может использовать">
            <div className="space-y-2">
              {users.map((d) => (
                <div key={d.id} className="flex items-center gap-2.5 text-[14px]">
                  <DoctorPortrait doctor={d} className="h-8 w-8 shrink-0" rounded="rounded-full" />
                  {d.lastName} {d.firstName[0]}.{d.patronymic[0]}.
                  {d.mainRoomId === room.id && <Badge tone="outline">основной</Badge>}
                </div>
              ))}
            </div>
          </Block>
          <Block title="Какие процедуры можно проводить">
            <ul className="space-y-1.5 text-[14px] text-ink/80">
              {procedures.map((s) => <li key={s.id}>{s.title} <span className="text-muted">· {s.durationMin} мин</span></li>)}
            </ul>
          </Block>
          <Block title="Оборудование">
            <div className="flex flex-wrap gap-1.5">
              {room.equipment.map((e) => <span key={e} className="rounded-lg bg-cream px-2.5 py-1 text-[12.5px] text-ink/75">{e}</span>)}
            </div>
          </Block>
        </div>

        <Block title="Занятость 12 октября" className="mt-8">
          <Timeline
            rows={[{ id: room.id, kind: "room", label: `№${room.number}` }]}
            appointments={data.appointments}
            from={WORKDAY_START}
            to={WORKDAY_END}
            doctors={data.doctors}
            services={data.services}
            labelWidth={70}
            minWidth={720}
          />
        </Block>
      </motion.div>
    </>
  );
}

/* =============== ИСТОЧНИКИ =============== */

export function AttributionTable({ a }: { a: Attribution }) {
  // Технические названия полей — в разделе «Для разработчиков → Структура данных»
  const rows: [string, string][] = [
    ["Источник", a.source], ["Канал", a.medium], ["Кампания", a.campaign], ["Метка источника в ссылке", a.utm_source],
    ["Метка канала в ссылке", a.utm_medium], ["Метка кампании в ссылке", a.utm_campaign], ["Страница входа", a.landing_page], ["Откуда перешёл", a.referrer],
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between gap-4 border-b border-line px-4 py-2 text-[13.5px] last:border-0">
          <span className="text-[13px] text-muted">{k}</span>
          <span className="truncate text-right text-forest-deep">{v}</span>
        </div>
      ))}
    </div>
  );
}

export function SourcesView() {
  const { data } = useService(async () => {
    const [rows, doctors] = await Promise.all([analyticsService.attributed(), doctorsService.list()]);
    return { rows, doctors };
  }, []);
  const [open, setOpen] = useState<AttributedRow | null>(null);
  if (!data) return null;
  const byCampaign = Object.entries(
    data.rows.reduce<Record<string, number>>((acc, r) => {
      const k = r.a.campaign === "—" ? "Без кампании" : r.a.campaign;
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);

  return (
    <>
      <AdminTitle title="Источники записей" lead="Для каждой онлайн-записи система запоминает, откуда пришёл пациент: из какой рекламы, публикации или ссылки. Так видно, какая реклама и какие публикации врачей действительно приводят пациентов." />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_300px]">
        <div className={`${card} min-w-0 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[14px]">
              <thead className="bg-cream/60 text-[11px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-5 py-3 font-medium">Пациент</th>
                  <th className="px-5 py-3 font-medium">Врач · услуга</th>
                  <th className="px-5 py-3 font-medium">Источник</th>
                  <th className="px-5 py-3 font-medium">Кампания</th>
                  <th className="px-5 py-3 font-medium">Материал</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.rows.map((r) => {
                  const d = data.doctors.find((x) => x.id === r.doctorId)!;
                  return (
                    <tr key={r.id} onClick={() => setOpen(r)} className="cursor-pointer transition hover:bg-cream/50">
                      <td className="px-5 py-3.5 font-medium text-forest-deep">{r.patient}{r.fresh && <Badge tone="gold" className="ml-2">демо</Badge>}</td>
                      <td className="px-5 py-3.5 text-muted"><span className="text-ink/80">{d.lastName}</span> · {r.service}</td>
                      <td className="px-5 py-3.5"><Badge tone="sage">{r.a.source}</Badge></td>
                      <td className="px-5 py-3.5 text-ink/80">{r.a.campaign}</td>
                      <td className="px-5 py-3.5 text-muted">{r.a.material ?? r.a.medium}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className={`${card} h-fit p-6`}>
          <div className="text-[15px] font-semibold text-forest-deep">По кампаниям</div>
          <div className="mt-4 space-y-3">
            {byCampaign.map(([k, v]) => (
              <div key={k}>
                <div className="flex justify-between text-[13px]"><span className="text-ink/80">{k}</span><span className="text-muted">{v}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-cream"><div className="h-full rounded-full bg-teal" style={{ width: `${(v / byCampaign[0][1]) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Modal open={!!open} onClose={() => setOpen(null)} title={open?.patient}>
        {open && (
          <>
            <p className="-mt-2 mb-5 text-sm text-muted">{open.service} · {open.when}</p>
            <AttributionTable a={open.a} />
          </>
        )}
      </Modal>
    </>
  );
}

/* =============== СМС =============== */

const SAMPLE: Appointment = {
  id: "sample", patientId: null, patientName: "Смирнова А.", doctorId: "orlova", serviceId: "cosm-consult", roomId: "201",
  date: DEMO_TODAY, start: toMin("11:00"), end: toMin("11:30"), status: "confirmed", kind: "visit", createdVia: "online", createdAt: "",
};

export function SmsView() {
  const chain = [
    { when: "После записи", icon: CalendarCheck, text: smsTemplates.created(SAMPLE) },
    { when: "За сутки", icon: BellRing, text: smsTemplates.dayBefore(SAMPLE) },
    { when: "За 2 часа", icon: Clock, text: smsTemplates.twoHours(SAMPLE) },
  ];
  const extra = [
    { when: "Перенос в МИС или ЛК", text: smsTemplates.changed({ ...SAMPLE, start: toMin("12:00") }) },
    { when: "Отмена", text: smsTemplates.cancelled(SAMPLE) },
  ];
  return (
    <>
      <AdminTitle title="СМС-сценарии" lead="Какие сообщения получает пациент. В прототипе сообщения только показываются на экране — настоящая отправка пока не подключена." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {chain.map((c, i) => (
            <motion.div key={c.when} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className={`${card} flex gap-4 p-5`}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-milk"><c.icon size={18} strokeWidth={1.5} /></span>
              <div>
                <div className="text-[13px] font-semibold uppercase tracking-wider text-teal">{c.when}</div>
                <div className="mt-1 text-[15px] leading-relaxed text-ink/85">«{c.text}»</div>
              </div>
            </motion.div>
          ))}
          <div className="pt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Дополнительно</div>
          {extra.map((c) => (
            <div key={c.when} className="rounded-[24px] border border-dashed border-line p-5">
              <div className="text-[13px] font-medium text-ink/70">{c.when}</div>
              <div className="mt-1 text-[14.5px] text-ink/80">«{c.text}»</div>
            </div>
          ))}
        </div>
        <div className="mx-auto w-full max-w-[340px] rounded-[44px] border-[10px] border-forest-deep bg-milk p-4 shadow-[var(--shadow-lift)]">
          <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-forest-deep" />
          <div className="mb-4 text-center text-xs text-muted">Ревиталь Парк</div>
          <div className="space-y-3">
            {chain.map((c, i) => (
              <motion.div key={c.when} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.5 }}>
                <div className="mb-1 text-[10.5px] text-muted">{c.when}</div>
                <div className="rounded-2xl rounded-tl-md bg-sage-soft p-3 text-[13px] leading-relaxed">{c.text}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* =============== ИНТЕГРАЦИЯ =============== */

const EVENT_LABEL: Record<string, string> = {
  "appointment.created": "Новая запись",
  "appointment.rescheduled": "Перенос",
  "appointment.cancelled": "Отмена",
  "shift.changed": "Смена врача",
};

export function IntegrationView({ onOpen }: { onOpen: (tab: "dev-exchange" | "dev-events") => void }) {
  const { data } = useService(async () => {
    const [status, events, contract] = await Promise.all([integrationService.syncStatus(), integrationService.events(), integrationService.contract()]);
    return { status, events, contract };
  }, []);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  if (!data) return null;
  const sync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
    }, 1400);
  };
  return (
    <>
      <AdminTitle
        title="Интеграция с МИС"
        lead="Как наша система обменивается данными с медицинской программой «Санаториум». Сейчас прототип работает на вымышленных данных."
        right={<Button onClick={sync} disabled={syncing}>{syncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} Обновить данные</Button>}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className={`${card} p-6`}>
          <Database size={20} className="text-teal" />
          <div className="mt-4 text-sm text-muted">Откуда сейчас данные</div>
          <div className="font-display mt-1 text-3xl text-forest-deep">Демо-данные</div>
          <div className="mt-2 text-xs text-muted">После подключения — из «Санаториума», экраны не меняются</div>
        </div>
        <div className={`${card} p-6`}>
          <RefreshCw size={20} className="text-teal" />
          <div className="mt-4 text-sm text-muted">Последнее обновление</div>
          <div className="font-display mt-1 text-3xl text-forest-deep">{synced ? "только что" : data.status.lastSync}</div>
          <div className="mt-2 text-xs text-muted">Запасная проверка изменений — каждые {data.status.pollingIntervalMin} минут</div>
        </div>
        <div className={`${card} p-6`}>
          <Webhook size={20} className="text-gold" />
          <div className="mt-4 text-sm text-muted">Мгновенные уведомления</div>
          <div className="font-display mt-1 text-3xl text-forest-deep">{data.status.webhook}</div>
          <div className="mt-2 text-xs text-muted">Нужно уточнить у разработчика «Санаториума»</div>
        </div>
      </div>
      <div className={`${card} mt-4 p-6`}>
        <div className="mb-4 text-[15px] font-semibold text-forest-deep">Что изменилось в «Санаториуме» сегодня (пример)</div>
        <div className="divide-y divide-line">
          {data.events.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-[14px]">
              <span className="w-12 tabular-nums text-muted">{e.at}</span>
              <Badge tone="sage">{EVENT_LABEL[e.type] ?? "Изменение"}</Badge>
              <span className="flex-1 text-ink/80">{e.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <QuickCard icon={<Database size={18} />} title="Обмен данными с МИС" text={`Получаем ${data.contract.receive.length} видов данных, передаём ${data.contract.send.length}. Все поля и примеры`} onClick={() => onOpen("dev-exchange")} />
        <QuickCard icon={<Webhook size={18} />} title="События об изменениях" text="Мгновенные уведомления и запасная проверка — подробно" onClick={() => onOpen("dev-events")} />
      </div>
    </>
  );
}
