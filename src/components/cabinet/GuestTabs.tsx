"use client";

import { BedDouble, CalendarDays, CheckCircle2, Clock, Coffee, FileText, MapPin, Phone, Sparkles, Stethoscope, Utensils } from "lucide-react";
import { useState } from "react";
import type { MedDocument, Patient } from "@/lib/types";
import { useService } from "@/hooks/useService";
import {
  appointmentsService, catalogService, doctorsService, documentsService, mealsService, prescriptionsService, proceduresService,
  TOMORROW, visitsService,
} from "@/services";
import { REVITAL } from "@/config/tenant";
import { FREQUENCY_LABEL, plural } from "@/lib/scheduling/planner";
import { daysBetween, DEMO_NOW, DEMO_TODAY, dayNum, fmtDay, fmtRange, fmtTime, fmtWeekdayLong, fmtWeekdayShort, nightsBetween } from "@/lib/time";
import { DocumentModal } from "@/components/mis/medical/DocumentPreview";
import { MealOrderEditor } from "@/components/mis/meals/MealOrderEditor";
import { CourseBar, DocStatusPill, useToast } from "@/components/mis/ui";
import { PrintButton, PrintSchedule } from "@/components/mis/print/Print";

const box = "rounded-[28px] border border-line bg-milk";
const Skeleton = () => <div className="h-64 animate-pulse rounded-[28px] bg-cream/60" />;

/* ---------------- Моё расписание ---------------- */

export function GuestSchedule({ patient }: { patient: Patient }) {
  const stay = patient.stay;
  const days = stay ? daysBetween(stay.from, stay.to) : [DEMO_TODAY];
  const [day, setDay] = useState(days.includes(DEMO_TODAY) ? DEMO_TODAY : days[0]);
  const { data } = useService(async () => {
    const [sessions, appointments, services] = await Promise.all([proceduresService.forPatient(patient.id), appointmentsService.forPatient(patient.id), doctorsService.services()]);
    return { sessions, appointments, services };
  }, [patient.id]);
  if (!data) return <Skeleton />;

  const items = [
    ...data.sessions.map((r) => ({
      key: r.session.id, date: r.session.date, start: r.session.start, end: r.session.end, title: r.procedure.title,
      where: `Кабинет №${r.room.number} · ${r.room.title}`, done: r.session.status === "done", missed: r.session.status === "missed",
      note: `${r.index} из ${r.total}`, doctor: false,
    })),
    ...data.appointments.filter((a) => a.status !== "cancelled").map((a) => ({
      key: a.id, date: a.date, start: a.start, end: a.end, title: data.services.find((s) => s.id === a.serviceId)?.title ?? "Приём врача",
      where: `Кабинет №${a.roomId} · ${visitsService.doctorName(a.doctorId)}`, done: a.status === "completed", missed: false, note: "", doctor: true,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);
  const list = items.filter((i) => i.date === day);
  const next = items.find((i) => i.date === DEMO_TODAY && i.start >= DEMO_NOW && !i.done);

  return (
    <>
      {next && day === DEMO_TODAY && (
        <div className="mb-6 flex items-center gap-4 rounded-[28px] bg-forest-deep p-5 text-milk sm:p-6">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold text-forest-deep"><Clock size={24} /></span>
          <div>
            <div className="text-[13px] font-semibold uppercase tracking-[0.16em] text-gold">Далее по расписанию</div>
            <div className="font-display text-[28px] leading-tight">{fmtTime(next.start)} · {next.title}</div>
            <div className="text-[15px] text-sage">{next.where}</div>
          </div>
        </div>
      )}

      <div className="scrollbar-none -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {days.map((d) => (
          <button key={d} onClick={() => setDay(d)} className={`flex h-[72px] w-16 shrink-0 flex-col items-center justify-center rounded-2xl border ${d === day ? "border-forest bg-forest text-milk" : "border-line bg-milk text-ink/80"}`}>
            <span className="font-display text-[26px] leading-none">{dayNum(d)}</span>
            <span className={`mt-1 text-[11px] uppercase ${d === day ? "text-sage" : "text-muted"}`}>{d === DEMO_TODAY ? "сегодня" : fmtWeekdayShort(d)}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-3xl capitalize text-forest-deep">{day === DEMO_TODAY ? "Сегодня" : fmtWeekdayLong(day)}, {fmtDay(day)}</h2>
        <PrintButton label="Распечатать расписание" make={() => <PrintSchedule forGuest patient={patient} items={items.map((i) => ({ date: i.date, start: i.start, end: i.end, title: i.title, where: i.where, done: i.done }))} />} />
      </div>
      {!list.length ? (
        <div className="rounded-[28px] border border-dashed border-line p-8 text-center text-[16px] text-muted">
          {stay && day === stay.to ? "День выезда: выезд до 12:00. Счастливого пути!" : "В этот день процедур нет — время для прогулок по парку."}
        </div>
      ) : (
        <ul className="space-y-3">
          {list.map((i) => (
            <li key={i.key} className={`${box} flex items-center gap-4 p-5 ${i.done ? "opacity-70" : ""}`}>
              <div className="w-20 shrink-0">
                <div className="text-[24px] font-semibold tabular-nums text-forest-deep">{fmtTime(i.start)}</div>
                <div className="text-[13px] text-muted">{fmtRange(i.start, i.end)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[17px] font-medium text-forest-deep">
                  {i.doctor && <Stethoscope size={17} className="shrink-0 text-teal" />} {i.title}
                </div>
                <div className="flex items-center gap-1.5 text-[14.5px] text-muted"><MapPin size={14} className="shrink-0" /> {i.where}</div>
                {i.note && <div className="text-[13.5px] text-muted">Процедура {i.note}</div>}
              </div>
              {i.done ? (
                <span className="flex shrink-0 items-center gap-1 text-[14px] font-medium text-ok"><CheckCircle2 size={18} /> <span className="hidden sm:inline">Пройдено</span></span>
              ) : i.missed ? (
                <span className="shrink-0 text-[14px] text-danger">Пропущено</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[14px] text-muted">Расписание составляет система по назначениям врача — с учётом времени питания. Если нужно перенести процедуру, скажите медсестре кабинета.</p>
    </>
  );
}

/* ---------------- Мои назначения ---------------- */

export function GuestCourse({ patient }: { patient: Patient }) {
  const { data } = useService(() => prescriptionsService.forPatient(patient.id), [patient.id]);
  if (!data) return <Skeleton />;
  if (!data.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-line p-8 text-center text-[16px] text-muted">
        Назначений пока нет. Врач составит курс процедур на первичном приёме — он сразу появится здесь и в расписании.
      </div>
    );
  }
  const done = data.reduce((s, c) => s + c.done, 0);
  const total = data.reduce((s, c) => s + c.total, 0);
  return (
    <>
      <div className={`${box} mb-5 p-5 sm:p-6`}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[17px] font-medium text-forest-deep">Весь курс</span>
          <span className="font-display text-[34px] leading-none text-forest-deep">{done} <span className="text-[20px] text-muted">из {total}</span></span>
        </div>
        <CourseBar done={done} total={total} className="mt-3" />
        <p className="mt-2 text-[14px] text-muted">Осталось {total - done} {plural(total - done, "процедура", "процедуры", "процедур")}. Отметку «пройдено» ставит медсестра — счётчик обновляется сразу.</p>
      </div>
      <ul className="grid gap-3 md:grid-cols-2">
        {data.map((c) => (
          <li key={c.prescription.id} className={`${box} p-5`}>
            <div className="flex items-start justify-between gap-3">
              <div className="text-[17px] font-medium leading-snug text-forest-deep">{c.procedure.title}</div>
              <span className="shrink-0 text-[16px] tabular-nums"><b className="text-forest-deep">{c.done}</b><span className="text-muted"> / {c.total}</span></span>
            </div>
            <CourseBar done={c.done} missed={c.missed} total={c.total} className="mt-3" />
            <div className="mt-2 text-[14px] text-muted">
              {FREQUENCY_LABEL[c.prescription.frequency]} · {c.procedure.durationMin} мин
              {c.next ? ` · следующая ${c.next.date === DEMO_TODAY ? "сегодня" : fmtDay(c.next.date)} в ${fmtTime(c.next.start)}` : " · курс пройден"}
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------------- Питание ---------------- */

export function GuestMeals({ patient }: { patient: Patient }) {
  const toast = useToast();
  const { data } = useService(async () => {
    const [order, today] = await Promise.all([mealsService.orderFor(patient.id, TOMORROW), mealsService.orderFor(patient.id, DEMO_TODAY)]);
    return { order, today };
  }, [patient.id]);
  const table = catalogService.dietTable(patient.dietTableId ?? "t15");
  const restaurant = mealsService.restaurantOf(patient);
  if (!data) return <Skeleton />;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="min-w-0">
        {restaurant?.preorder ? (
          <>
            <h2 className="font-display text-3xl text-forest-deep">Заказ на завтра, {fmtDay(TOMORROW)}</h2>
            <p className="mb-5 mt-1 text-[15.5px] text-muted">
              {data.order ? "Заказ принят — его можно изменить до 20:00." : "Выберите блюда до 20:00 — кухня приготовит их к завтраку, обеду и ужину."} Показаны только блюда, подходящие вашему столу.
            </p>
            <MealOrderEditor
              key={data.order?.id ?? "new"}
              big
              tableId={table.id}
              initial={data.order?.dishIds ?? []}
              saveLabel={data.order ? "Изменить заказ" : "Заказать"}
              onSave={async (ids) => {
                await mealsService.setOrder(patient.id, TOMORROW, ids, true);
                toast.show("Заказ на завтра принят");
              }}
            />
          </>
        ) : (
          <div className={`${box} p-6 text-[16px] text-ink/80`}>
            Вы питаетесь в зале «{restaurant?.title ?? "Ресторан"}» — заказывать заранее не нужно. Блюда вашего стола отмечены на раздаче табличкой «{table.short}».
          </div>
        )}
      </div>
      <aside className="space-y-4">
        <div className={`${box} p-5`}>
          <div className="flex items-center gap-2 text-[16px] font-semibold text-forest-deep"><Utensils size={18} className="text-teal" /> Ваш диетстол</div>
          <div className="mt-2 text-[17px] text-forest-deep">{table.title}</div>
          <p className="mt-1 text-[14.5px] text-muted">{table.description} Назначен врачом.</p>
        </div>
        <div className={`${box} p-5`}>
          <div className="flex items-center gap-2 text-[16px] font-semibold text-forest-deep"><Coffee size={18} className="text-teal" /> Сегодня в меню</div>
          {data.today ? (
            <ul className="mt-2 space-y-1 text-[14.5px] text-ink/85">{data.today.dishIds.map((id) => <li key={id}>· {catalogService.dish(id).title}</li>)}</ul>
          ) : (
            <p className="mt-2 text-[14.5px] text-muted">Блюда шведского стола по вашему диетстолу.</p>
          )}
        </div>
      </aside>
      {toast.node}
    </div>
  );
}

/* ---------------- Мои документы ---------------- */

export function GuestDocuments({ patient }: { patient: Patient }) {
  const { data } = useService(() => documentsService.forPatient(patient.id), [patient.id]);
  const [open, setOpen] = useState<MedDocument | null>(null);
  if (!data) return <Skeleton />;
  // Гость видит документ только после подписи врача
  const docs = data.filter((d) => d.status !== "draft");
  return (
    <>
      {!docs.length ? (
        <div className="rounded-[28px] border border-dashed border-line p-8 text-center text-[16px] text-muted">Документы появятся здесь после подписи врача: протокол приёма, выписка.</div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {docs.map((d) => (
            <li key={d.id}>
              <button onClick={() => setOpen(d)} className={`${box} flex w-full items-center gap-4 p-5 text-left hover:border-forest/40`}>
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage-soft text-forest"><FileText size={22} strokeWidth={1.5} /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-medium text-forest-deep">{d.title}</span>
                  <span className="block text-[14px] text-muted">{fmtDay(d.date)} · {visitsService.doctorName(d.doctorId)}</span>
                  <span className="mt-1.5 block"><DocStatusPill status={d.status} /></span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-[14px] text-muted">Документы со статусом «Зарегистрирован в РЭМД» доступны также на Госуслугах.</p>
      <DocumentModal doc={open} patient={patient} onClose={() => setOpen(null)} />
    </>
  );
}

/* ---------------- Проживание ---------------- */

export function GuestStay({ patient }: { patient: Patient }) {
  const stay = patient.stay;
  const san = REVITAL.sanatoriums.find((s) => s.id === (patient.sanatoriumId ?? "gelendzhik"))!;
  if (!stay) return <div className="rounded-[28px] border border-dashed border-line p-8 text-center text-muted">Проживание не оформлено.</div>;
  const program = patient.programId ? catalogService.program(patient.programId) : null;
  const left = nightsBetween(DEMO_TODAY, stay.to);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className={`${box} p-6`}>
        <div className="flex items-center gap-2 text-[16px] font-semibold text-forest-deep"><BedDouble size={19} className="text-teal" /> Номер</div>
        <div className="font-display mt-2 text-[44px] leading-none text-forest-deep">№ {stay.roomNumber}</div>
        <div className="mt-2 text-[15.5px] text-ink/80">{stay.building}</div>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-[15px]">
          <div><dt className="text-[13px] text-muted">Заезд</dt><dd className="font-medium">{fmtDay(stay.from)}, с {san.checkIn}</dd></div>
          <div><dt className="text-[13px] text-muted">Выезд</dt><dd className="font-medium">{fmtDay(stay.to)}, до {san.checkOut}</dd></div>
          <div><dt className="text-[13px] text-muted">Осталось</dt><dd className="font-medium">{left > 0 ? `${left} ${plural(left, "ночь", "ночи", "ночей")}` : "выезд сегодня"}</dd></div>
          <div><dt className="text-[13px] text-muted">Ресепшн</dt><dd className="flex items-center gap-1 font-medium"><Phone size={14} /> 100 из номера</dd></div>
        </dl>
      </div>
      {program && (
        <div className={`${box} p-6`}>
          <div className="flex items-center gap-2 text-[16px] font-semibold text-forest-deep"><Sparkles size={19} className="text-teal" /> Программа</div>
          <div className="font-display mt-2 text-[30px] leading-tight text-forest-deep">{program.title}</div>
          <p className="mt-1 text-[15px] text-muted">{program.description}</p>
          <ul className="mt-4 space-y-1.5 text-[15px] text-ink/85">
            {program.includes.map((i) => <li key={i} className="flex gap-2"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-ok" /> {i}</li>)}
          </ul>
        </div>
      )}
      <div className={`${box} p-6 lg:col-span-2`}>
        <div className="flex items-center gap-2 text-[16px] font-semibold text-forest-deep"><CalendarDays size={19} className="text-teal" /> Распорядок</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[["Завтрак", san.meals.breakfast], ["Обед", san.meals.lunch], ["Ужин", san.meals.dinner]].map(([t, v]) => (
            <div key={t} className="rounded-2xl bg-cream/70 p-4"><div className="text-[14px] text-muted">{t}</div><div className="text-[19px] font-medium text-forest-deep">{v}</div></div>
          ))}
        </div>
        <p className="mt-3 text-[14px] text-muted">{san.address} · {san.facts[0]}</p>
      </div>
    </div>
  );
}
