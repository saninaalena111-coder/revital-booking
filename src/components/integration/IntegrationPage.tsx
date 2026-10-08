"use client";

import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowRight, ArrowUpRight, BarChart3, BellRing, CalendarCheck, Database, Megaphone, Repeat, ShieldCheck, Stethoscope, UserRound } from "lucide-react";
import { useService } from "@/hooks/useService";
import { integrationService } from "@/services";
import type { ContractItem } from "@/services/integrationService";
import { SectionTitle } from "@/components/ui/Eyebrow";
import { LinkButton } from "@/components/ui/Button";
import { LogoMark } from "@/components/brand/Logo";
import { Architecture } from "./Architecture";
import { EventsDemo } from "./EventsDemo";
import { Prescriptions, StageBadge } from "./Prescriptions";

const OURS = [
  "контакт пациента", "связь с ID пациента в МИС", "ID записи", "источник обращения", "статус записи", "время",
  "врача", "канал уведомления", "историю уведомлений", "маркетинговые данные", "пользовательские настройки",
];
const MIS = [
  "электронную медицинскую карту", "историю болезни", "протоколы врача", "диагнозы", "медицинские назначения",
  "результаты обследований", "медицинскую документацию", "данные о проведённом лечении",
];
const JOURNEY = [
  { icon: Megaphone, label: "Реклама / сайт" },
  { icon: CalendarCheck, label: "Запись" },
  { icon: BellRing, label: "Напоминания" },
  { icon: UserRound, label: "Личный кабинет" },
  { icon: BarChart3, label: "Аналитика" },
  { icon: Repeat, label: "Повторная коммуникация" },
];

export function IntegrationContent() {
  const { data } = useService(() => integrationService.contract(), []);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8">
      {/* архитектура */}
      <section className="mt-14">
        <Architecture />
      </section>

      {/* API */}
      <section id="api" className="mt-28 scroll-mt-24">
        <SectionTitle
          eyebrow="Зачем нужен API «Санаториума»"
          title="Расписание живёт в МИС — мы должны видеть его в реальном времени"
          lead="Без API система не знает, кто из врачей работает, какие кабинеты заняты и какие записи уже сделаны по телефону. Через API она получает эти данные и передаёт обратно выбранное пациентом время."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <ContractCard title="Что получаем из МИС" sub="для первой версии" icon={<ArrowDownLeft size={18} />} items={data?.receive} />
          <ContractCard title="Что передаём в МИС" sub="минимально" icon={<ArrowUpRight size={18} />} items={data?.send} dark />
        </div>
      </section>

      {/* webhook */}
      <section id="events" className="mt-28 scroll-mt-24">
        <SectionTitle
          eyebrow="Зачем нужны события об изменении записи"
          title="Если запись изменили в «Санаториуме», пациент должен узнать об этом"
          lead="Например, пациент записан на 11:00, а администратор перенёс его в МИС на 12:00. Если ничего не сделать, в личном кабинете останется старое время и пациент придёт не вовремя. Нажмите кнопку и сравните два варианта."
        />
        <div className="mt-12">
          <EventsDemo />
        </div>
      </section>

      {/* разделение данных */}
      <section id="data" className="mt-28 scroll-mt-24">
        <SectionTitle
          eyebrow="Важное разделение данных"
          title="Что хранит наша система, а что остаётся в МИС"
          lead="Медицинские сведения не дублируются без необходимости. Наша система знает, когда и к кому записан пациент, но не знает его диагнозов."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[32px] bg-forest-deep p-7 text-milk sm:p-9">
            <div className="flex items-center gap-3">
              <LogoMark light className="h-9 w-9" />
              <div>
                <div className="font-display text-3xl">Revital Medical Booking</div>
                <div className="text-sm text-sage">клиентский путь · хранит</div>
              </div>
            </div>
            <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {OURS.map((x) => (
                <li key={x} className="flex items-center gap-2.5 text-[15px]">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /> {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[32px] border border-line bg-milk p-7 sm:p-9">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-soft">
                <Database size={18} strokeWidth={1.4} className="text-teal" />
              </span>
              <div>
                <div className="font-display text-3xl text-forest-deep">МИС «Санаториум»</div>
                <div className="text-sm text-muted">медицинское ядро · хранит</div>
              </div>
            </div>
            <ul className="mt-8 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {MIS.map((x) => (
                <li key={x} className="flex items-center gap-2.5 text-[15px] text-ink/85">
                  <ShieldCheck size={15} strokeWidth={1.5} className="shrink-0 text-teal" /> {x}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* почему не заменяем */}
      <section id="why" className="mt-28 scroll-mt-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.3fr] lg:items-center">
          <SectionTitle
            eyebrow="Почему не заменяем «Санаториум»"
            title="МИС отвечает за лечение. Новая система — за путь пациента"
            lead="Revital Medical Booking не пытается заменить медицинскую информационную систему. Врачи продолжают работать в привычной программе, а пациент получает современный сервис записи."
          />
          <ol className="relative space-y-3 before:absolute before:bottom-6 before:left-[27px] before:top-6 before:w-px before:bg-line">
            {JOURNEY.map((j, i) => (
              <motion.li
                key={j.label}
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative flex items-center gap-4"
              >
                <span className={`relative grid h-14 w-14 shrink-0 place-items-center rounded-full ${i === 1 ? "bg-forest text-milk" : "border border-line bg-milk text-teal"}`}>
                  <j.icon size={20} strokeWidth={1.4} />
                </span>
                <span className="font-display text-[26px] text-forest-deep">{j.label}</span>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      {/* этап 2 */}
      <section id="stage-2" className="mt-28 scroll-mt-24">
        <div className="rounded-[36px] bg-cream/70 p-6 sm:p-12">
          <StageBadge />
          <h2 className="font-display mt-5 max-w-3xl text-4xl leading-[1.05] text-forest-deep sm:text-5xl">Назначения терапевта — сразу в личном кабинете</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-4">
            {[
              { icon: UserRound, t: "Гость приходит к терапевту" },
              { icon: Stethoscope, t: "Терапевт делает назначения в привычной МИС" },
              { icon: Database, t: "Наша система получает список разрешённых процедур" },
              { icon: CalendarCheck, t: "Пациент сам выбирает удобное время" },
            ].map((s, i) => (
              <div key={s.t} className="flex items-start gap-3 rounded-2xl bg-milk p-4">
                <span className="font-display grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sage-soft text-forest">{i + 1}</span>
                <span className="text-[14px] leading-snug text-ink/80">{s.t}</span>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Prescriptions />
          </div>
          <p className="mt-8 max-w-3xl text-[14.5px] leading-relaxed text-muted">
            Это второй этап разработки. Он требует доступа к назначениям врача в МИС «Санаториум» — только к назначениям конкретного пациента, а не ко всей медицинской карте.
          </p>
        </div>
      </section>

      <section className="mt-20 flex flex-col items-start justify-between gap-6 rounded-[32px] border border-line p-8 sm:flex-row sm:items-center sm:p-10">
        <div>
          <div className="font-display text-3xl text-forest-deep">Что потребуется от «Санаториума»</div>
          <p className="mt-2 text-muted">Короткий список для обсуждения с разработчиком МИС</p>
        </div>
        <LinkButton href="/requirements" size="lg">
          Открыть список <ArrowRight size={18} />
        </LinkButton>
      </section>
    </div>
  );
}

function ContractCard({ title, sub, icon, items, dark }: { title: string; sub: string; icon: React.ReactNode; items?: ContractItem[]; dark?: boolean }) {
  return (
    <div className={`rounded-[32px] p-6 sm:p-8 ${dark ? "bg-forest-deep text-milk" : "border border-line bg-milk"}`}>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-full ${dark ? "bg-gold text-forest-deep" : "bg-sage-soft text-forest"}`}>{icon}</span>
        <div>
          <div className={`font-display text-3xl ${dark ? "" : "text-forest-deep"}`}>{title}</div>
          <div className={`text-sm ${dark ? "text-sage" : "text-muted"}`}>{sub}</div>
        </div>
      </div>
      <ul className={`mt-6 divide-y ${dark ? "divide-milk/10" : "divide-line"}`}>
        {items?.map((it) => (
          <li key={it.title} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <div className={`flex flex-wrap items-center gap-2 text-[15px] font-medium ${dark ? "" : "text-forest-deep"}`}>
                {it.title}
                {it.stage === 2 && <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10.5px] font-semibold text-[#7a5a1c]">этап 2</span>}
              </div>
              <div className={`text-[13px] ${dark ? "text-sage/80" : "text-muted"}`}>{it.hint}</div>
            </div>
            <code className={`hidden shrink-0 rounded-lg px-2 py-1 font-mono text-[11px] sm:block ${dark ? "bg-milk/10 text-sage" : "bg-cream text-muted"}`}>{it.tech}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}
