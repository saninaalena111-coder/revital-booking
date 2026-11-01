"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Clock, Palette, Presentation, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { db } from "@/mock/db";
import { useSession } from "@/hooks/useSession";
import { sessionService } from "@/services";
import { ViewSwitch } from "@/components/mis/ViewSwitch";
import { Segmented } from "@/components/ui/Segmented";

/**
 * Демо-сценарии для презентации: каждый шаг открывает нужный экран под нужной ролью
 * (параметр ?as= в адресе МИС). Сценарии показывают одну ситуацию с двух сторон —
 * глазами гостя и глазами сотрудника.
 */
const SCENARIOS: { title: string; time: string; steps: { label: string; href: string }[] }[] = [
  {
    title: "Гость записался с сайта — запись у врача и в карте",
    time: "2 мин",
    steps: [
      { label: "Гость записывается к Марии Ивановне Орловой", href: "/booking" },
      { label: "Врач видит запись «С сайта» в своём дне", href: "/mis/today?as=doctor" },
      { label: "Запись в карте гостя", href: "/mis/patient?id=p-anna&as=doctor" },
    ],
  },
  {
    title: "Врач проводит первичный приём голосом и назначает курс",
    time: "2 мин",
    steps: [
      { label: "«Мой день» → пациентка Ковалёва ждёт приёма", href: "/mis/today?as=doctor" },
      { label: "Приём: диктовка, диагноз, назначения", href: "/mis/reception?appointment=a-o1&as=doctor" },
    ],
  },
  {
    title: "Система раскладывает процедуры без конфликтов",
    time: "1 мин",
    steps: [
      { label: "Назначить Тарасову курс → «Подобрать время»", href: "/mis/patient?id=p-tarasov&tab=prescriptions&as=doctor" },
      { label: "Загрузка кабинетов с учётом мест и питания", href: "/mis/rooms-schedule?as=doctor" },
    ],
  },
  {
    title: "Медсестра отмечает процедуру выполненной",
    time: "1 мин",
    steps: [
      { label: "Очередь кабинета → «Выполнено»", href: "/mis/procedures?as=nurse" },
      { label: "У гостя обновился счётчик курса", href: "/cabinet?tab=course" },
    ],
  },
  {
    title: "Документ подписан и ушёл в ЕГИСЗ через N3.Health",
    time: "1 мин",
    steps: [
      { label: "«Подписать» → QR → «Отправить в ЕГИСЗ»", href: "/mis/egisz?as=doctor" },
      { label: "Документ с ошибкой → «Исправить»", href: "/mis/egisz?as=doctor" },
    ],
  },
  {
    title: "Ресепшн заселяет гостя по шахматке",
    time: "1 мин",
    steps: [{ label: "Заезды сегодня → «Заселить», шахматка номеров", href: "/mis/stays?as=reception" }],
  },
  {
    title: "Руководитель видит загрузку и выручку по сети",
    time: "1 мин",
    steps: [
      { label: "Сводная панель: все санатории", href: "/mis/analytics?as=manager" },
      { label: "Маркетолог: источники, но без медкарт", href: "/mis/patients?as=marketer" },
    ],
  },
  {
    title: "Сотрудник спрашивает помощника, как оформить выписку",
    time: "1 мин",
    steps: [{ label: "Помощник отвечает по шагам и ведёт на экран", href: "/mis/today?as=doctor&ask=как оформить выписку" }],
  },
  {
    title: "Главный врач видит, что сделано и что нет",
    time: "1 мин",
    steps: [
      { label: "Отчёты и качество: «Требует внимания»", href: "/mis/reports?as=chief" },
      { label: "Печать отчёта и листа назначений", href: "/mis/patient?id=p-anna&tab=prescriptions&as=chief" },
    ],
  },
  {
    title: "Глазами гостя: расписание процедур и выписка",
    time: "2 мин",
    steps: [
      { label: "Врач формирует и подписывает выписку Анне", href: "/mis/patient?id=p-anna&as=doctor" },
      { label: "Гость: «Моё расписание»", href: "/cabinet" },
      { label: "Гость: «Мои документы» — выписка", href: "/cabinet?tab=documents" },
    ],
  },
];

/** Вопросы прототипа онлайн-записи — первая часть презентации */
const BOOKING_TOUR = [
  { q: "Как записывается пациент", href: "/booking" },
  { q: "Чем отличаются гости и амбулаторные пациенты", href: "/booking" },
  { q: "Почему нельзя смотреть только на свободный кабинет", href: "/logic?case=busy-doctor" },
  { q: "Как одновременно блокируются врач и кабинет", href: "/logic?case=example-1" },
  { q: "Зачем нужен обмен данными с «Санаториумом»", href: "/how-it-works#api" },
  { q: "Зачем нужны события об изменении записи", href: "/how-it-works#events" },
  { q: "Польза личного кабинета, СМС и аналитики", href: "/cabinet?tab=visits" },
  { q: "Не только МИС: какие ещё задачи компании закрываются", href: "/more" },
];

export function DemoNavigator() {
  const pathname = usePathname();
  const { tenant } = useSession();
  const [open, setOpen] = useState(false);
  const [part, setPart] = useState<"mis" | "booking">("mis");
  const [expanded, setExpanded] = useState<number | null>(0);
  const [resetDone, setResetDone] = useState(false);
  const staff = pathname.startsWith("/mis") || pathname.startsWith("/admin");

  return (
    <div className="fixed bottom-4 right-4 z-[55] sm:bottom-6 sm:right-6 print:hidden">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className="glass absolute bottom-14 right-0 flex max-h-[min(720px,calc(100vh-96px))] w-[min(400px,calc(100vw-32px))] flex-col rounded-3xl shadow-[var(--shadow-lift)]"
          >
            <div className="p-5 pb-3">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">Демо для руководства</div>
                <button onClick={() => setOpen(false)} aria-label="Закрыть" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-forest">
                  <X size={16} />
                </button>
              </div>
              <ViewSwitch current={staff ? "staff" : "guest"} className="w-full" />
              <Segmented
                size="sm"
                className="mt-3"
                value={part}
                onChange={setPart}
                options={[
                  { value: "mis", label: "Сценарии МИС" },
                  { value: "booking", label: "Онлайн-запись" },
                ]}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
              {part === "mis" ? (
                <ol className="space-y-1">
                  {SCENARIOS.map((s, i) => (
                    <li key={s.title} className={`rounded-2xl ${expanded === i ? "bg-milk/80" : ""}`}>
                      <button onClick={() => setExpanded(expanded === i ? null : i)} aria-expanded={expanded === i} className="flex w-full items-start gap-3 rounded-2xl px-2 py-2 text-left hover:bg-milk/80">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-[11px] font-semibold text-milk">{i + 1}</span>
                        <span className="min-w-0 flex-1 text-[14px] leading-snug text-ink/85">{s.title}</span>
                        <span className="mt-0.5 flex shrink-0 items-center gap-1 text-[11.5px] text-muted"><Clock size={11} /> {s.time}</span>
                        <ChevronDown size={15} className={`mt-1 shrink-0 text-muted transition ${expanded === i ? "rotate-180" : ""}`} />
                      </button>
                      {expanded === i && (
                        <ol className="space-y-1 pb-2 pl-11 pr-2">
                          {s.steps.map((st, k) => (
                            <li key={st.label}>
                              <Link href={st.href} onClick={() => setOpen(false)} className="flex min-h-9 items-center gap-2 rounded-xl px-2 py-1.5 text-[13.5px] text-forest hover:bg-sage-soft">
                                <span className="text-muted">{k + 1}.</span> {st.label} →
                              </Link>
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ol>
              ) : (
                <ol className="space-y-1">
                  {BOOKING_TOUR.map((t, i) => (
                    <li key={t.q}>
                      <Link href={t.href} onClick={() => setOpen(false)} className="group flex items-start gap-3 rounded-2xl px-2 py-2 hover:bg-milk/80">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-[11px] font-semibold text-milk">{i + 1}</span>
                        <span className="text-[14px] leading-snug text-ink/85 group-hover:text-forest">{t.q}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted">
              <button
                onClick={() => {
                  db.reset();
                  setResetDone(true);
                  setTimeout(() => setResetDone(false), 2500);
                }}
                className="inline-flex min-h-8 items-center gap-1.5 hover:text-forest"
              >
                <RotateCcw size={13} /> {resetDone ? "Демо-данные сброшены" : "Сбросить демо-данные"}
              </button>
              <button onClick={() => sessionService.setTenant(tenant.id === "revital" ? "demo" : "revital")} className="inline-flex min-h-8 items-center gap-1.5 hover:text-forest">
                <Palette size={13} /> {tenant.id === "revital" ? "Другой санаторий" : "Стиль Ревиталь"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        className="glass-dark flex h-11 items-center gap-2 rounded-full pl-3 pr-4 text-[13px] font-medium text-milk shadow-[var(--shadow-lift)]"
      >
        <Presentation size={16} strokeWidth={1.6} /> Демо-сценарии
      </button>
    </div>
  );
}
