"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CalendarX2, CheckCircle2, Clock, FileSignature, Globe, PlayCircle, Stethoscope } from "lucide-react";
import { useState } from "react";
import type { ISODate } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { documentsService, patientAge, patientFullName, PATIENT_TYPE_LABEL, visitsService, type DayItem } from "@/services";
import { addDays, DEMO_NOW, DEMO_TODAY, fmtRange, fmtTime, fmtWeekdayShort, dayNum, relativeDay } from "@/lib/time";
import { Button, LinkButton } from "@/components/ui/Button";
import { MisTitle } from "../MisShell";
import { card, EmptyState, Loading, Stat, StatusPill } from "../ui";

const STATUS_VIEW = {
  waiting: { tone: "wait", icon: Clock, label: "Ожидает" },
  in_progress: { tone: "gold", icon: Stethoscope, label: "Идёт приём" },
  done: { tone: "ok", icon: CheckCircle2, label: "Приём завершён" },
  missed: { tone: "danger", icon: CalendarX2, label: "Не пришёл" },
} as const;

/** «Мой день»: пациенты врача на сегодня по времени и кнопка «Начать приём» */
export function DoctorDay() {
  const { user } = useSession();
  const doctorId = user?.doctorId ?? "orlova";
  const [date, setDate] = useState<ISODate>(DEMO_TODAY);
  const { data } = useService(() => visitsService.doctorDay(doctorId, date), [doctorId, date]);
  const { data: drafts } = useService(
    async () => (await documentsService.list({ doctorId })).filter((r) => r.doc.status === "draft" || r.doc.status === "error"),
    [doctorId],
  );
  const days = Array.from({ length: 6 }, (_, i) => addDays(DEMO_TODAY, i));

  const waiting = data?.filter((d) => d.status === "waiting" || d.status === "in_progress") ?? [];
  const next = date === DEMO_TODAY ? waiting[0] : undefined;

  return (
    <>
      <MisTitle
        title="Мой день"
        lead={`${user ? `${user.firstName} ${user.patronymic}` : "Доктор"}, здесь пациенты на ${relativeDay(date)} по времени. Нажмите «Начать приём» — откроется осмотр.`}
      />

      {/* выбор дня */}
      <div className="scrollbar-none -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {days.map((d) => (
          <button
            key={d}
            onClick={() => setDate(d)}
            className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border transition ${
              d === date ? "border-forest bg-forest text-milk" : "border-white/70 bg-milk/70 text-ink/80 shadow-[var(--shadow-soft)] backdrop-blur-sm hover:border-forest/40"
            }`}
          >
            <span className="font-display text-2xl leading-none">{dayNum(d)}</span>
            <span className={`mt-1 text-[11px] uppercase ${d === date ? "text-sage" : "text-muted"}`}>{d === DEMO_TODAY ? "сегодня" : fmtWeekdayShort(d)}</span>
          </button>
        ))}
      </div>

      {!data ? (
        <Loading />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
          <div className="min-w-0">
            <div className="mb-5 grid grid-cols-3 gap-3">
              <Stat label="Всего записей" value={data.length} />
              <Stat label="Приняты" value={data.filter((d) => d.status === "done").length} tone="ok" />
              <Stat label="Ожидают" value={waiting.length} tone={waiting.length ? "gold" : undefined} />
            </div>

            {next && <NextUp item={next} />}

            {data.length === 0 ? (
              <EmptyState icon={CalendarX2} title="Записей нет" text="В этот день к вам никто не записан. Свободное время видно пациентам в онлайн-записи." />
            ) : (
              <ol className={`${card} divide-y divide-line overflow-hidden`}>
                {data.map((item) => (
                  <DayRow key={item.appointment.id} item={item} />
                ))}
              </ol>
            )}
          </div>

          <aside className="space-y-4">
            <div className={`${card} p-5`}>
              <div className="flex items-center gap-2 text-[15px] font-semibold text-forest-deep">
                <FileSignature size={18} className="text-teal" /> Документы ждут подписи
              </div>
              {!drafts?.length ? (
                <p className="mt-2 text-[14px] text-muted">Все документы подписаны.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {drafts.slice(0, 4).map((r) => (
                    <li key={r.doc.id}>
                      <Link href={`/mis/patient?id=${r.patient.id}&tab=documents`} className="flex items-start gap-2 rounded-xl p-2 hover:bg-cream">
                        {r.doc.status === "error" ? <AlertTriangle size={16} className="mt-0.5 shrink-0 text-danger" /> : <FileSignature size={16} className="mt-0.5 shrink-0 text-muted" />}
                        <span className="text-[14px] leading-snug">
                          <span className="block font-medium text-forest-deep">{patientFullName(r.patient)}</span>
                          <span className="text-muted">{r.doc.title}{r.doc.status === "error" && " — ошибка ЕГИСЗ"}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <LinkButton href="/mis/egisz" variant="secondary" size="sm" className="mt-4 w-full">
                Все документы <ArrowRight size={15} />
              </LinkButton>
            </div>
            <div className={`${card} p-5 text-[14px] leading-relaxed text-muted`}>
              <div className="mb-1 flex items-center gap-2 font-semibold text-forest-deep">
                <Globe size={17} className="text-teal" /> Записи с сайта
              </div>
              Гости записываются в онлайн-записи и в личном кабинете — запись сразу появляется в этом списке с пометкой «С сайта».
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function NextUp({ item }: { item: DayItem }) {
  const router = useRouter();
  const p = item.patient;
  const late = item.appointment.start < DEMO_NOW;
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-5 rounded-3xl bg-forest-deep p-5 text-milk sm:p-6">
      <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-gold">{late ? "Ожидает в коридоре" : "Следующий пациент"}</div>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-display text-[30px] leading-tight">{p ? patientFullName(p) : item.appointment.patientName}</div>
          <div className="mt-1 text-[15px] text-sage">
            {fmtTime(item.appointment.start)} · {item.serviceTitle}
            {p?.stay && ` · номер ${p.stay.roomNumber}`}
          </div>
          {!!p?.allergies?.length && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-danger px-3 py-1 text-[13px] font-medium text-milk">
              <AlertTriangle size={14} /> Аллергия: {p.allergies.join(", ")}
            </div>
          )}
        </div>
        <Button variant="gold" size="lg" onClick={() => router.push(`/mis/reception?appointment=${item.appointment.id}`)} disabled={!p}>
          <PlayCircle size={19} /> {item.status === "in_progress" ? "Продолжить приём" : "Начать приём"}
        </Button>
      </div>
    </motion.div>
  );
}

function DayRow({ item }: { item: DayItem }) {
  const p = item.patient;
  const v = STATUS_VIEW[item.status];
  const online = item.appointment.createdVia === "online";
  return (
    <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
      <div className="w-24 shrink-0 tabular-nums">
        <div className="text-[20px] font-semibold text-forest-deep">{fmtTime(item.appointment.start)}</div>
        <div className="text-[12.5px] text-muted">{fmtRange(item.appointment.start, item.appointment.end)}</div>
      </div>
      <div className="min-w-0 flex-1">
        {p ? (
          <Link href={`/mis/patient?id=${p.id}`} className="text-[16px] font-medium text-forest-deep hover:underline">
            {patientFullName(p)}
          </Link>
        ) : (
          <span className="text-[16px] font-medium text-forest-deep">{item.appointment.patientName}</span>
        )}
        <div className="mt-0.5 text-[13.5px] text-muted">
          {item.serviceTitle}
          {p && ` · ${patientAge(p)} лет · ${p.stay ? `номер ${p.stay.roomNumber}` : PATIENT_TYPE_LABEL[p.type].toLowerCase()}`}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <StatusPill tone={v.tone} icon={v.icon}>{v.label}</StatusPill>
          {online && <StatusPill tone="info" icon={Globe}>С сайта</StatusPill>}
          {!!p?.allergies?.length && <StatusPill tone="danger" icon={AlertTriangle}>Аллергия: {p.allergies.join(", ")}</StatusPill>}
        </div>
      </div>
      {p && (
        <div className="shrink-0">
          {item.status === "done" || item.appointment.date > DEMO_TODAY ? (
            <LinkButton href={`/mis/patient?id=${p.id}`} variant="ghost" size="sm">Карта гостя</LinkButton>
          ) : (
            <LinkButton href={`/mis/reception?appointment=${item.appointment.id}`} variant={item.status === "in_progress" ? "gold" : "primary"} size="md" className="w-full sm:w-auto">
              <PlayCircle size={17} /> {item.status === "in_progress" ? "Продолжить" : "Начать приём"}
            </LinkButton>
          )}
        </div>
      )}
    </li>
  );
}
