"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CalendarDays, Check, ClipboardList, DoorOpen, Loader2, MessageSquare, Plus, Send, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import type { Appointment, Doctor, Service, Slot } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { appointmentsService, doctorsService, notificationsService, patientsService } from "@/services";
import { addDays, dayNum, DEMO_TODAY, daysBetween, fmtDay, fmtTime, fmtWeekdayLong, fmtWeekdayShort } from "@/lib/time";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";
import { DoctorPortrait } from "@/components/brand/DoctorPortrait";
import { SlotPicker } from "@/components/booking/SlotPicker";
import { Prescriptions, StageBadge } from "@/components/integration/Prescriptions";

type Tab = "visits" | "prescriptions" | "notifications";

export function Cabinet() {
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>((params.get("tab") as Tab) ?? "visits");
  const { data: patient } = useService(() => patientsService.current(), []);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-8 sm:pt-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal">Личный кабинет</div>
          <h1 className="font-display mt-3 text-5xl text-forest-deep sm:text-6xl">Добрый день{patient ? `, ${patient.firstName}` : ""}</h1>
          {patient?.stay && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="sage">Гость Ревиталь Парк</Badge>
              <Badge tone="outline">Номер {patient.stay.roomNumber}</Badge>
              <Badge tone="outline">
                Проживание {dayNum(patient.stay.from)}–{fmtDay(patient.stay.to)}
              </Badge>
            </div>
          )}
        </div>
        <LinkButton href="/booking">
          <Plus size={17} /> Новая запись
        </LinkButton>
      </div>

      <Segmented
        className="mt-10"
        value={tab}
        onChange={setTab}
        options={[
          { value: "visits", label: "Мои записи" },
          { value: "prescriptions", label: "Мои назначения" },
          { value: "notifications", label: "Уведомления" },
        ]}
      />

      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="mt-8">
          {tab === "visits" && <Visits patientId={patient?.id} />}
          {tab === "prescriptions" && <PrescriptionsTab />}
          {tab === "notifications" && <Notifications />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ---------------- записи ---------------- */

function Visits({ patientId }: { patientId?: string }) {
  const { data } = useService(async () => {
    if (!patientId) return null;
    const [list, doctors, services] = await Promise.all([appointmentsService.forPatient(patientId), doctorsService.list(), doctorsService.services()]);
    return { list, doctors, services };
  }, [patientId]);
  const [reschedule, setReschedule] = useState<Appointment | null>(null);
  const [cancel, setCancel] = useState<Appointment | null>(null);

  if (!data) return <div className="h-64 animate-pulse rounded-[28px] bg-cream/60" />;
  const upcoming = data.list.filter((a) => a.status === "confirmed" && a.date >= DEMO_TODAY);
  const history = data.list.filter((a) => a.status === "completed").reverse();
  const cancelled = data.list.filter((a) => a.status === "cancelled");
  const docOf = (a: Appointment) => data.doctors.find((d) => d.id === a.doctorId)!;
  const svcOf = (a: Appointment) => data.services.find((s) => s.id === a.serviceId);

  return (
    <>
      <h2 className="font-display text-3xl text-forest-deep">Предстоящие</h2>
      <div className="mt-5 space-y-4">
        {upcoming.length === 0 && (
          <div className="rounded-[28px] border border-dashed border-line p-8 text-center text-muted">
            Предстоящих записей нет. <Link href="/booking" className="text-teal underline-offset-4 hover:underline">Записаться</Link>
          </div>
        )}
        <AnimatePresence>
          {upcoming.map((a) => (
            <motion.div key={a.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -30 }}>
              <UpcomingCard a={a} doctor={docOf(a)} service={svcOf(a)} onReschedule={() => setReschedule(a)} onCancel={() => setCancel(a)} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <h2 className="font-display mt-14 text-3xl text-forest-deep">История посещений</h2>
      <div className="mt-5 divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-milk">
        {history.map((a) => (
          <div key={a.id} className="flex items-center gap-4 p-5">
            <div className="w-16 shrink-0 text-center">
              <div className="font-display text-3xl leading-none text-forest-deep">{dayNum(a.date)}</div>
              <div className="text-xs text-muted">окт</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-medium text-forest-deep">{svcOf(a)?.title}</div>
              <div className="truncate text-sm text-muted">
                {docOf(a).firstName} {docOf(a).patronymic} {docOf(a).lastName} · {fmtTime(a.start)}
              </div>
            </div>
            <Badge tone="neutral">
              <Check size={12} /> Завершено
            </Badge>
          </div>
        ))}
        {cancelled.map((a) => (
          <div key={a.id} className="flex items-center gap-4 p-5 opacity-60">
            <div className="w-16 shrink-0 text-center">
              <div className="font-display text-3xl leading-none text-forest-deep">{dayNum(a.date)}</div>
              <div className="text-xs text-muted">окт</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] font-medium text-forest-deep line-through">{svcOf(a)?.title}</div>
              <div className="truncate text-sm text-muted">{docOf(a).lastName} · {fmtTime(a.start)}</div>
            </div>
            <Badge tone="danger">Отменено</Badge>
          </div>
        ))}
      </div>

      {reschedule && <RescheduleModal a={reschedule} doctor={docOf(reschedule)} onClose={() => setReschedule(null)} />}
      <CancelModal a={cancel} doctor={cancel ? docOf(cancel) : undefined} onClose={() => setCancel(null)} />
    </>
  );
}

function UpcomingCard({ a, doctor, service, onReschedule, onCancel }: { a: Appointment; doctor: Doctor; service?: Service; onReschedule: () => void; onCancel: () => void }) {
  return (
    <div className="flex flex-col gap-5 rounded-[28px] border border-line bg-milk p-5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:p-6">
      <div className="flex items-center gap-5">
        <div className="w-20 shrink-0 rounded-2xl bg-forest-deep px-2 py-3 text-center text-milk">
          <div className="font-display text-4xl leading-none">{dayNum(a.date)}</div>
          <div className="mt-1 text-[11px] uppercase tracking-wider text-sage">{fmtWeekdayShort(a.date)}</div>
        </div>
        <DoctorPortrait doctor={doctor} className="hidden aspect-[4/5] w-16 shrink-0 sm:block" rounded="rounded-2xl" />
        <div className="min-w-0">
          <div className="font-display text-[26px] leading-tight text-forest-deep">
            {fmtDay(a.date)}, {fmtTime(a.start)}
          </div>
          <div className="mt-1 text-[15px] text-ink/80">
            {doctor.firstName} {doctor.patronymic} {doctor.lastName}
          </div>
          <div className="text-sm text-muted">{service?.title}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone="ok">
              <Check size={12} /> Подтверждено
            </Badge>
            {a.roomId && (
              <Badge tone="outline">
                <DoorOpen size={12} /> Кабинет №{a.roomId}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2 sm:ml-auto">
        <Button variant="secondary" size="sm" onClick={onReschedule}>
          <CalendarDays size={15} /> Перенести
        </Button>
        <Button variant="ghost" size="sm" onClick={onCancel} className="!text-danger hover:!bg-danger-soft">
          <X size={15} /> Отменить
        </Button>
      </div>
    </div>
  );
}

function RescheduleModal({ a, doctor, onClose }: { a: Appointment; doctor: Doctor; onClose: () => void }) {
  const [slot, setSlot] = useState<Slot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    if (!slot) return;
    setBusy(true);
    try {
      await appointmentsService.reschedule(a.id, slot);
      onClose();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };
  return (
    <Modal open onClose={onClose} title="Перенос записи" wide>
      <p className="-mt-2 mb-6 text-sm text-muted">
        {doctor.firstName} {doctor.patronymic} {doctor.lastName} · сейчас: {fmtDay(a.date)}, {fmtTime(a.start)}
      </p>
      <SlotPicker doctorIds={[a.doctorId]} serviceId={a.serviceId!} dates={daysBetween(DEMO_TODAY, addDays(DEMO_TODAY, 13))} value={slot} onChange={setSlot} initialDate={a.date} />
      {error && <p className="mt-4 text-sm text-danger">{error}</p>}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="text-sm text-muted">{slot ? `Новое время: ${fmtDay(slot.date)}, ${fmtWeekdayLong(slot.date)}, ${fmtTime(slot.start)}` : "Выберите новое время"}</div>
        <Button onClick={save} disabled={!slot || busy}>
          {busy && <Loader2 size={16} className="animate-spin" />} Перенести запись
        </Button>
      </div>
    </Modal>
  );
}

function CancelModal({ a, doctor, onClose }: { a: Appointment | null; doctor?: Doctor; onClose: () => void }) {
  const [busy, setBusy] = useState(false);
  const confirm = async () => {
    if (!a) return;
    setBusy(true);
    await appointmentsService.cancel(a.id);
    setBusy(false);
    onClose();
  };
  return (
    <Modal open={!!a} onClose={onClose} title="Отменить запись?">
      {a && doctor && (
        <>
          <p className="text-[15px] leading-relaxed text-ink/80">
            {fmtDay(a.date)}, {fmtTime(a.start)} · {doctor.firstName} {doctor.patronymic} {doctor.lastName}
          </p>
          <p className="mt-3 text-sm text-muted">Время освободится для других пациентов — вместе с врачом и кабинетом. Мы отправим СМС с подтверждением отмены.</p>
          <div className="mt-7 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Оставить
            </Button>
            <Button onClick={confirm} disabled={busy} className="!bg-danger hover:!bg-[#9c4a3f]">
              {busy && <Loader2 size={16} className="animate-spin" />} Отменить запись
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

/* ---------------- назначения (этап 2) ---------------- */

function PrescriptionsTab() {
  return (
    <div>
      <div className="rounded-[28px] border border-dashed border-gold/70 bg-gold-soft/30 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-3">
          <ClipboardList size={22} strokeWidth={1.4} className="text-[#7a5a1c]" />
          <StageBadge />
        </div>
        <p className="mt-4 max-w-3xl text-[15.5px] leading-relaxed text-ink/80">
          После консультации терапевта назначения могут поступать из медицинской системы «Санаториум». Тогда пациент сможет выбирать удобное время только для разрешённых ему процедур.
        </p>
        <p className="mt-2 text-sm text-muted">Ниже — пример того, как это будет выглядеть. Сейчас раздел не связан с МИС.</p>
      </div>
      <div className="mt-6">
        <Prescriptions />
      </div>
    </div>
  );
}

/* ---------------- уведомления ---------------- */

function Notifications() {
  const { data } = useService(async () => {
    const [settings, sms] = await Promise.all([notificationsService.settings(), notificationsService.list()]);
    return { settings, sms };
  }, []);
  if (!data) return null;
  const sms = [...data.sms].reverse();

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-6 rounded-[28px] border border-line bg-milk p-6">
          <div className="flex items-center gap-4">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-sage-soft text-forest">
              <MessageSquare size={19} strokeWidth={1.5} />
            </span>
            <div>
              <div className="text-[16px] font-medium text-forest-deep">Напоминать мне о записях по СМС</div>
              <div className="text-sm text-muted">Сразу после записи, за сутки и за 2 часа до приёма</div>
            </div>
          </div>
          <Toggle checked={data.settings.smsEnabled} onChange={(v) => notificationsService.setSmsEnabled(v)} label="СМС-напоминания" />
        </div>
        {[
          { icon: Send, t: "Telegram", s: "Напоминания в мессенджере" },
          { icon: Bell, t: "MAX", s: "Напоминания в мессенджере" },
        ].map((c) => (
          <div key={c.t} className="flex items-center justify-between gap-6 rounded-[28px] border border-line p-6 opacity-70">
            <div className="flex items-center gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-cream text-muted">
                <c.icon size={18} strokeWidth={1.5} />
              </span>
              <div>
                <div className="text-[16px] font-medium text-forest-deep">{c.t}</div>
                <div className="text-sm text-muted">{c.s}</div>
              </div>
            </div>
            <Badge tone="outline">скоро</Badge>
          </div>
        ))}
        <p className="px-2 text-xs text-muted">Демо: СМС только формируются и показываются здесь. Реальная отправка не подключена.</p>
      </div>

      {/* телефон */}
      <div className="mx-auto w-full max-w-[360px] rounded-[44px] border-[10px] border-forest-deep bg-milk p-4 shadow-[var(--shadow-lift)]">
        <div className="mx-auto mb-4 h-5 w-24 rounded-full bg-forest-deep" />
        <div className="mb-3 text-center text-xs text-muted">Ревиталь Парк</div>
        <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
          {sms.map((m) => (
            <div key={m.id}>
              <div className="mb-1 text-[10.5px] text-muted">
                {m.sendAt} · {m.status === "sent" ? "отправлено" : m.status === "scheduled" ? "запланировано" : "отключено"}
              </div>
              <div className={`rounded-2xl rounded-tl-md p-3 text-[13px] leading-relaxed ${m.status === "sent" ? "bg-sage-soft text-ink" : m.status === "scheduled" ? "border border-dashed border-line text-ink/70" : "bg-cream text-muted line-through"}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
