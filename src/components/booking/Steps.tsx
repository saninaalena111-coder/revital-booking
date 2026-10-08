"use client";

import { motion } from "framer-motion";
import {
  ArrowRight, Bath, CalendarDays, Check, Footprints, Hand, Hotel, Loader2, Lock, Plane, Search, Stethoscope, Waves,
} from "lucide-react";
import { useState } from "react";
import type { ISODate, Patient } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { DirectionIcon } from "@/components/ui/DirectionIcon";
import { useService } from "@/hooks/useService";
import { doctorsService, patientsService } from "@/services";
import { addDays, dayNum, daysBetween, DEMO_TODAY, fmtDay, fmtWeekdayShort, parseDate, weekday } from "@/lib/time";
import { StepTitle, type Path } from "./BookingFlow";

/* ---------------- ШАГ 1 ---------------- */

const STATUS_CARDS: { path: Path; icon: typeof Hotel; title: string; text: string; cta: string }[] = [
  { path: "guest", icon: Hotel, title: "Я сейчас проживаю в Revital Park", text: "Вы уже являетесь гостем санатория.", cta: "Продолжить" },
  { path: "future", icon: Plane, title: "Я планирую приехать в Revital Park", text: "Вы планируете проживание и хотите заранее организовать лечение.", cta: "Продолжить" },
  { path: "outpatient", icon: Footprints, title: "Хочу записаться без проживания", text: "Амбулаторный приём врача или отдельная медицинская услуга.", cta: "Выбрать специалиста" },
];

export function StatusStep({ onPick }: { onPick: (p: Path) => void }) {
  return (
    <>
      <StepTitle eyebrow="Шаг 1" title="Подскажите, пожалуйста, как вы планируете посетить Revital Park?" />
      <div className="grid gap-4 md:grid-cols-3">
        {STATUS_CARDS.map((c, i) => (
          <motion.button
            key={c.path}
            type="button"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.08 }}
            onClick={() => onPick(c.path)}
            className="group flex flex-col rounded-[28px] border border-line bg-milk p-6 text-left transition hover:-translate-y-1 hover:border-teal/40 hover:shadow-[var(--shadow-lift)] sm:p-7"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-sage-soft text-forest transition group-hover:bg-forest group-hover:text-milk">
              <c.icon size={20} strokeWidth={1.4} />
            </span>
            <span className="font-display mt-8 text-[27px] leading-[1.1] text-forest-deep">{c.title}</span>
            <span className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">{c.text}</span>
            <span className="mt-8 inline-flex items-center gap-2 self-start rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-milk transition group-hover:gap-3">
              {c.cta} <ArrowRight size={15} />
            </span>
          </motion.button>
        ))}
      </div>
    </>
  );
}

/* ---------------- ГОСТЬ: ИДЕНТИФИКАЦИЯ ---------------- */

export function GuestIdStep({ onFound }: { onFound: (p: Patient) => void }) {
  const [phone, setPhone] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // В рабочей версии: patientsService → integrationService → поиск бронирования в МИС
    const p = await patientsService.findGuestBooking(phone, lastName);
    setLoading(false);
    if (p) onFound(p);
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <StepTitle eyebrow="Гость санатория" title="Найдём ваше бронирование" lead="Укажите телефон и фамилию, на которые оформлено проживание." />
        <form onSubmit={submit} className="space-y-4">
          <Field label="Номер телефона" value={phone} onChange={setPhone} placeholder="+7 (900) 123-45-67" type="tel" />
          <Field label="Фамилия" value={lastName} onChange={setLastName} placeholder="Смирнова" />
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button type="submit" size="lg" disabled={loading}>
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              {loading ? "Ищем бронирование…" : "Найти бронирование"}
            </Button>
            <span className="text-xs text-muted">Демо: подойдут любые данные</span>
          </div>
        </form>
      </div>
      <aside className="self-end rounded-[28px] bg-cream/70 p-7">
        <Hotel size={22} strokeWidth={1.3} className="text-teal" />
        <p className="mt-4 text-[15px] leading-relaxed text-ink/80">
          Мы сверяем данные с системой бронирования санатория. Медицинская карта для записи не запрашивается.
        </p>
      </aside>
    </div>
  );
}

export function Field({ label, value, onChange, placeholder, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-medium text-ink/70">{label}</span>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-14 w-full rounded-2xl border border-line bg-milk px-5 text-[16px] text-ink outline-none transition placeholder:text-muted/50 focus:border-teal focus:ring-4 focus:ring-sage/40"
      />
    </label>
  );
}

/* ---------------- ГОСТЬ: НАЙДЕНО ---------------- */

const LOCKED = [
  { icon: Hand, label: "Массаж" },
  { icon: Bath, label: "Лечебные ванны" },
  { icon: Waves, label: "Физиотерапия" },
];

export function GuestFoundStep({ patient, onNext }: { patient: Patient; onNext: () => void }) {
  const stay = patient.stay!;
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr]">
      <motion.div initial={{ scale: 0.97, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative overflow-hidden rounded-[32px] bg-forest-deep p-7 text-milk sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-teal/50 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-milk/10 px-3 py-1.5 text-sm">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-gold text-forest-deep">
              <Check size={12} strokeWidth={3} />
            </span>
            Бронирование найдено
          </div>
          <div className="font-display mt-8 text-5xl">
            {patient.firstName} {patient.lastName}
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-6 border-t border-milk/15 pt-6 text-sm">
            <div>
              <dt className="text-sage">Комплекс</dt>
              <dd className="mt-1 text-base">{stay.building}</dd>
            </div>
            <div>
              <dt className="text-sage">Номер</dt>
              <dd className="mt-1 text-base">{stay.roomNumber}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sage">Проживание</dt>
              <dd className="mt-1 text-base">
                {dayNum(stay.from)}–{fmtDay(stay.to)}
              </dd>
            </div>
          </dl>
        </div>
      </motion.div>

      <div className="flex flex-col">
        <StepTitle eyebrow="Первый шаг лечения" title="Приём терапевта" />
        <p className="-mt-4 text-[15.5px] leading-relaxed text-muted">
          Терапевт проведёт осмотр и составит программу на время вашего отдыха.
        </p>
        <Button size="lg" className="mt-7 self-start" onClick={onNext}>
          <Stethoscope size={18} /> Записаться к терапевту
        </Button>
        <p className="mt-3 text-xs text-muted">Первичный приём необходим для формирования индивидуальных назначений.</p>

        <div className="mt-auto pt-8">
          <div className="rounded-3xl border border-line p-5">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-ink/70">
              <Lock size={14} className="text-gold" /> Станут доступны после консультации
            </div>
            <div className="flex flex-wrap gap-2">
              {LOCKED.map((l) => (
                <span key={l.label} className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1.5 text-[13px] text-muted">
                  <l.icon size={14} strokeWidth={1.4} /> {l.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- БУДУЩИЙ ГОСТЬ ---------------- */

export function FutureIntroStep({ onPlan, onOutpatient }: { onPlan: () => void; onOutpatient: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-end">
      <div>
        <StepTitle
          eyebrow="Будущий гость"
          title="Планируете лечение во время проживания?"
          lead="Лечение в Revital Park начинается с консультации терапевта. Её можно забронировать заранее — на первые дни после заезда. Процедуры врач назначит на приёме."
        />
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={onPlan}>
            <CalendarDays size={18} /> Запланировать первичную консультацию терапевта
          </Button>
          <Button size="lg" variant="ghost" onClick={onOutpatient}>
            Нужен другой специалист
          </Button>
        </div>
      </div>
      <ol className="space-y-3">
        {["Выберите дату заезда", "Выберите терапевта и время", "Получите программу процедур на приёме"].map((t, i) => (
          <li key={t} className="flex items-center gap-4 rounded-2xl bg-cream/70 p-4">
            <span className="font-display grid h-10 w-10 shrink-0 place-items-center rounded-full bg-milk text-xl text-forest">{i + 1}</span>
            <span className="text-[15px] text-ink/80">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function FutureDateStep({ value, onPick }: { value?: ISODate; onPick: (d: ISODate) => void }) {
  const [sel, setSel] = useState<ISODate | undefined>(value);
  const start = addDays(DEMO_TODAY, 1);
  const days = daysBetween(start, addDays(start, 34));
  const lead = weekday(start) - 1; // пустые ячейки до понедельника
  const monthOf = (d: ISODate) => parseDate(d).toLocaleString("ru-RU", { month: "long" });

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.1fr]">
      <div>
        <StepTitle eyebrow="Будущий гость" title="Когда вы планируете приехать?" lead="Достаточно ориентировочной даты заезда. Мы покажем консультации терапевта в первые три дня после неё." />
        {sel && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-cream/70 p-6">
            <div className="text-sm text-muted">Дата заезда</div>
            <div className="font-display mt-1 text-4xl text-forest-deep">
              {fmtDay(sel)}, {fmtWeekdayShort(sel)}
            </div>
            <Button size="lg" className="mt-6" onClick={() => onPick(sel)}>
              Показать консультации <ArrowRight size={18} />
            </Button>
          </motion.div>
        )}
      </div>
      <div className="rounded-[28px] border border-line bg-milk p-5 sm:p-7">
        <div className="mb-4 flex items-baseline justify-between">
          <div className="font-display text-2xl capitalize text-forest-deep">
            {monthOf(start)} — {monthOf(days[days.length - 1])}
          </div>
          <div className="text-xs text-muted">2026</div>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {["пн", "вт", "ср", "чт", "пт", "сб", "вс"].map((w) => (
            <div key={w} className="pb-2 text-[11px] uppercase tracking-wider text-muted">
              {w}
            </div>
          ))}
          {Array.from({ length: lead }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {days.map((d) => {
            const first = dayNum(d) === 1;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSel(d)}
                className={`relative aspect-square rounded-2xl text-[15px] tabular-nums transition ${
                  sel === d ? "bg-forest text-milk" : "hover:bg-sage-soft"
                } ${weekday(d) >= 6 && sel !== d ? "text-teal" : ""}`}
              >
                {dayNum(d)}
                {first && <span className={`absolute inset-x-0 bottom-1 text-[8.5px] uppercase ${sel === d ? "text-sage" : "text-gold"}`}>{monthOf(d).slice(0, 3)}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- АМБУЛАТОРНО: НАПРАВЛЕНИЯ ---------------- */

export function DirectionStep({ onPick }: { onPick: (id: string) => void }) {
  const { data } = useService(() => doctorsService.directions(), []);
  return (
    <>
      <StepTitle eyebrow="Без проживания" title="Выберите направление" lead="Амбулаторный приём врача или отдельная медицинская услуга." />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((d, i) => (
          <motion.button
            key={d.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onPick(d.id)}
            className="group flex items-start gap-4 rounded-3xl border border-line bg-milk p-5 text-left transition hover:border-teal/40 hover:shadow-[var(--shadow-soft)]"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage-soft text-forest transition group-hover:bg-forest group-hover:text-milk">
              <DirectionIcon name={d.icon} size={22} />
            </span>
            <span className="flex-1">
              <span className="font-display block text-[25px] leading-tight text-forest-deep">{d.title}</span>
              <span className="mt-1 block text-[13.5px] leading-snug text-muted">{d.description}</span>
            </span>
            <ArrowRight size={16} className="mt-2 text-forest opacity-0 transition group-hover:opacity-100" />
          </motion.button>
        ))}
      </div>
    </>
  );
}

/* ---------------- АМБУЛАТОРНО: УСЛУГА ---------------- */

export function ServiceStep({ doctorId, directionId, onPick }: { doctorId: string; directionId: string; onPick: (id: string) => void }) {
  const { data: doctor } = useService(() => doctorsService.get(doctorId), [doctorId]);
  const { data: services } = useService(() => doctorsService.services(doctorId), [doctorId]);
  if (!doctor || !services) return null;
  const ordered = [...services.filter((s) => s.directionId === directionId), ...services.filter((s) => s.directionId !== directionId)];
  return (
    <>
      <StepTitle eyebrow={`${doctor.firstName} ${doctor.patronymic} ${doctor.lastName}`} title="Выберите услугу" />
      <div className="divide-y divide-line overflow-hidden rounded-[28px] border border-line bg-milk">
        {ordered.map((s) => (
          <button key={s.id} onClick={() => onPick(s.id)} className="group flex w-full items-center gap-5 p-5 text-left transition hover:bg-cream/50 sm:p-6">
            <div className="flex-1">
              <div className="text-[16.5px] font-semibold text-forest-deep">{s.title}</div>
              <div className="mt-1 text-sm text-muted">{s.description}</div>
            </div>
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium text-ink">{s.priceRub.toLocaleString("ru-RU")} ₽</div>
              <div className="text-xs text-muted">{s.durationMin} мин</div>
            </div>
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-forest transition group-hover:border-forest group-hover:bg-forest group-hover:text-milk">
              <ArrowRight size={16} />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
