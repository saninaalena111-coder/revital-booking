"use client";

import { motion } from "framer-motion";
import {
  ArrowRight, Award, BookOpenCheck, Bot, CalendarCheck2, Check, Compass, GraduationCap, HeartHandshake, MapPin, Megaphone,
  MessageCircle, Presentation, Sparkles, Star, Utensils,
} from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Eyebrow, SectionTitle } from "@/components/ui/Eyebrow";

const fade = {
  hidden: { opacity: 0, y: 16 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] as const } }),
};

const TASKS = [
  {
    icon: Compass, title: "Путеводитель гостя и мини-приложение",
    text: "Всё о пребывании в одном месте: распорядок, процедуры, рестораны, СПА, экскурсии, карта парка. Мини-приложение в мессенджере — без установки, с напоминаниями о процедурах.",
    result: "Меньше вопросов на ресепшн, больше допродаж процедур и экскурсий",
  },
  {
    icon: Award, title: "Система мотивации персонала",
    text: "Вместе с отделом персонала: баллы за стаж, отзывы гостей, выполнение стандартов и наставничество. Понятные уровни и прозрачный рейтинг — сотрудник видит, за что получит поощрение.",
    result: "Ниже текучесть, выше качество сервиса",
  },
  {
    icon: Presentation, title: "Презентации и отчёты для собраний",
    text: "Отчёты руководству собираются из данных системы: загрузка, выручка, качество лечения, отзывы. Презентации к планёркам и советам директоров — в фирменном стиле.",
    result: "Решения на цифрах, а не на ощущениях",
  },
  {
    icon: Bot, title: "Автоматизация рутины",
    text: "Помощники для сотрудников и гостей: ответы на частые вопросы, шаблоны документов, рассылки, сбор и разбор отзывов. Всё, что повторяется каждый день, делает система.",
    result: "Часы персонала уходят на гостей, а не на бумаги",
  },
  {
    icon: GraduationCap, title: "Обучение персонала",
    text: "Короткие инструкции и видео по новым процессам, справка внутри системы, сопровождение запуска на каждом объекте сети.",
    result: "Быстрый и спокойный переход на новую систему",
  },
  {
    icon: Megaphone, title: "Сайт, запись и маркетинг",
    text: "Посадочные страницы программ, метки рекламы и аналитика источников гостей, сценарии напоминаний и возврата гостей.",
    result: "Видно, какая реклама приводит гостей",
  },
];

const STEPS = [
  { title: "Главный проект — МИС", text: "Собственная медицинская система для всей сети: по этапам, с понятными сроками." },
  { title: "Параллельные задачи", text: "Путеводитель, мотивация, отчёты, автоматизация — берутся в работу по приоритету руководства." },
  { title: "Сроки по договорённости", text: "Каждая задача получает срок и результат, который можно проверить." },
  { title: "Отчёт каждый месяц", text: "Что сделано, что в работе, что дальше — коротко и по делу." },
];

/** Не только МИС: какие ещё корпоративные задачи может закрывать один специалист */
export function More() {
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-8 lg:pt-16">
        <motion.div initial="hidden" animate="show" className="max-w-3xl">
          <motion.div variants={fade} custom={0}><Eyebrow>Не только МИС</Eyebrow></motion.div>
          <motion.h1 variants={fade} custom={1} className="font-display mt-6 text-[42px] leading-[1.02] text-forest-deep sm:text-[64px]">
            Один специалист — <span className="text-teal">несколько задач компании</span>
          </motion.h1>
          <motion.p variants={fade} custom={2} className="mt-6 text-lg leading-relaxed text-muted">
            Разработка собственной МИС — главный проект. Параллельно — другие корпоративные задачи: всё, что делает работу сети
            удобнее для гостей и сотрудников. Всё это — в рамках одной работы и согласованных сроков.
          </motion.p>
        </motion.div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TASKS.map((t, i) => (
            <motion.article
              key={t.title}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-40px" }}
              variants={fade}
              custom={i}
              className="surface surface-hover flex flex-col rounded-[28px] p-6 sm:p-7"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-sage-soft to-sage text-forest">
                <t.icon size={22} strokeWidth={1.5} />
              </span>
              <h2 className="mt-5 text-[19px] font-semibold leading-snug text-forest-deep">{t.title}</h2>
              <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted">{t.text}</p>
              <p className="mt-4 flex gap-2 rounded-2xl bg-gold-soft/50 px-4 py-3 text-[14px] text-[#6b4f1a]">
                <Sparkles size={16} className="mt-0.5 shrink-0" /> {t.result}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* Два примера крупнее */}
      <section className="mx-auto mt-20 grid max-w-7xl gap-6 px-4 sm:px-8 lg:grid-cols-2">
        <div className="surface rounded-[32px] p-6 sm:p-8">
          <Eyebrow>Пример · путеводитель гостя</Eyebrow>
          <h2 className="font-display mt-4 text-[32px] leading-tight text-forest-deep">Санаторий в кармане гостя</h2>
          <p className="mt-2 text-[15px] text-muted">Открывается из сообщения после бронирования — без установки приложения.</p>
          <div className="mx-auto mt-6 w-full max-w-[300px] rounded-[40px] border-[9px] border-forest-deep bg-milk p-4 shadow-[var(--shadow-lift)]">
            <div className="mx-auto mb-3 h-4 w-20 rounded-full bg-forest-deep" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">Ревиталь Парк Геленджик</div>
            <div className="font-display mt-1 text-[22px] text-forest-deep">Добрый день, Анна</div>
            {[
              { icon: CalendarCheck2, t: "Сегодня: 3 процедуры", s: "Ближайшая — 14:00, терренкур" },
              { icon: Utensils, t: "Ужин 18:00–20:00", s: "Заказ на завтра — до 20:00" },
              { icon: MapPin, t: "Карта парка", s: "Пляж, бассейн, лечебный корпус" },
              { icon: Star, t: "Экскурсии и СПА", s: "Записаться в один клик" },
            ].map((x) => (
              <div key={x.t} className="mt-2 flex items-center gap-3 rounded-2xl bg-cream/80 p-3">
                <x.icon size={18} className="shrink-0 text-teal" />
                <div className="leading-tight">
                  <div className="text-[13.5px] font-medium text-forest-deep">{x.t}</div>
                  <div className="text-[11.5px] text-muted">{x.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface rounded-[32px] p-6 sm:p-8">
          <Eyebrow>Пример · мотивация персонала</Eyebrow>
          <h2 className="font-display mt-4 text-[32px] leading-tight text-forest-deep">Понятно, за что поощрение</h2>
          <p className="mt-2 text-[15px] text-muted">Разрабатывается вместе с отделом персонала, считается по данным системы.</p>
          <div className="mt-6 space-y-3">
            {[
              { lvl: "Новичок", from: "до 1 года", pct: 25 },
              { lvl: "Специалист", from: "1–3 года", pct: 55 },
              { lvl: "Мастер", from: "3–5 лет", pct: 80 },
              { lvl: "Наставник", from: "от 5 лет, ведёт новичков", pct: 100 },
            ].map((l, i) => (
              <div key={l.lvl} className="rounded-2xl border border-line/80 bg-milk/70 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-semibold text-forest-deep">{i + 1}. {l.lvl}</span>
                  <span className="text-[13px] text-muted">{l.from}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-cream"><div className="h-full rounded-full bg-gradient-to-r from-teal to-forest" style={{ width: `${l.pct}%` }} /></div>
              </div>
            ))}
          </div>
          <ul className="mt-5 grid gap-2 text-[14.5px] text-ink/85 sm:grid-cols-2">
            {[
              { icon: Star, t: "Отзывы гостей" },
              { icon: BookOpenCheck, t: "Выполнение стандартов" },
              { icon: HeartHandshake, t: "Наставничество" },
              { icon: MessageCircle, t: "Предложения по улучшению" },
            ].map((x) => (
              <li key={x.t} className="flex items-center gap-2"><x.icon size={16} className="text-teal" /> {x.t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-8">
        <SectionTitle eyebrow="Как организована работа" title="Приоритеты — от руководства, результат — каждый месяц" />
        <ol className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="surface rounded-[28px] p-6">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-[14px] font-semibold text-milk">{i + 1}</span>
              <div className="mt-4 text-[17px] font-semibold text-forest-deep">{s.title}</div>
              <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col items-start gap-4 rounded-[32px] bg-forest-deep p-7 text-milk sm:flex-row sm:items-center sm:justify-between sm:p-9">
          <div>
            <div className="font-display text-[30px] leading-tight">Начать можно с МИС уже сейчас</div>
            <p className="mt-1 flex items-center gap-2 text-[15px] text-sage"><Check size={16} className="text-gold" /> Прототип показывает, как будет работать система для всей сети</p>
          </div>
          <LinkButton href="/mis" variant="gold" size="lg">
            Открыть МИС <ArrowRight size={18} />
          </LinkButton>
        </div>
      </section>
    </>
  );
}
