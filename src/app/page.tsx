"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight, BellRing, CalendarCheck, Clock, Globe, Hotel, Link2, Megaphone, MessageSquare,
  PhoneOff, Plane, QrCode, Send, Smartphone, Footprints, UserRound, Camera, DoorOpen,
} from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { Eyebrow, SectionTitle } from "@/components/ui/Eyebrow";
import { Landscape } from "@/components/brand/Landscape";
import { DoctorPortrait } from "@/components/brand/DoctorPortrait";
import { useService } from "@/hooks/useService";
import { appointmentsService, doctorsService } from "@/services";
import { DEMO_TODAY, fmtTime, relativeDay } from "@/lib/time";

const fade = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const } }),
};

const PERKS = [
  { icon: PhoneOff, title: "Запись без звонка", text: "Пара минут в браузере — без ожидания на линии" },
  { icon: CalendarCheck, title: "Актуальное расписание", text: "Только реально свободное время врача и кабинета" },
  { icon: BellRing, title: "Напоминания о визите", text: "SMS сразу, за сутки и за два часа до приёма" },
  { icon: UserRound, title: "Личный кабинет пациента", text: "Перенос, отмена и история посещений" },
];

const CHANNELS = [
  { icon: Globe, label: "Сайт", q: "utm_source=site&utm_medium=button&utm_campaign=main" },
  { icon: Camera, label: "Соцсети", q: "utm_source=instagram&utm_medium=reels&utm_campaign=gyn_after_35" },
  { icon: Megaphone, label: "Реклама", q: "utm_source=yandex&utm_medium=cpc&utm_campaign=neuro_back_pain" },
  { icon: QrCode, label: "QR-код", q: "utm_source=qr&utm_medium=room_card&utm_campaign=rooms_qr" },
  { icon: Send, label: "Telegram", q: "utm_source=telegram&utm_medium=channel_post&utm_campaign=no_stress_week" },
  { icon: MessageSquare, label: "MAX", q: "utm_source=max&utm_medium=message&utm_campaign=course_reminder" },
  { icon: Smartphone, label: "SMS", q: "utm_source=sms&utm_medium=broadcast&utm_campaign=spring_return" },
  { icon: Link2, label: "Прямая ссылка", q: "" },
];

const PATHS = [
  {
    icon: Hotel, path: "guest", title: "Гость санатория",
    text: "Находим бронирование по телефону и фамилии. Первый шаг — приём терапевта, который составит индивидуальную программу.",
    tag: "Только терапевт на первом этапе",
  },
  {
    icon: Plane, path: "future", title: "Планирует приезд",
    text: "Выбирает дату заезда и заранее бронирует первичную консультацию терапевта на первые дни отдыха.",
    tag: "Консультация после заезда",
  },
  {
    icon: Footprints, path: "outpatient", title: "Без проживания",
    text: "Амбулаторный приём: каталог направлений, выбор врача, услуги и удобного времени.",
    tag: "Свободный выбор специалиста",
  },
];

export default function HomePage() {
  const { data: nearest } = useService(() => appointmentsService.nearest("orlova", "ther-primary", DEMO_TODAY), []);
  const { data: doctors } = useService(() => doctorsService.list(), []);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-6 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:pb-24 lg:pt-14">
          <motion.div initial="hidden" animate="show" className="flex flex-col justify-center">
            <motion.div variants={fade} custom={0}>
              <Eyebrow>Медицинский центр · онлайн-запись</Eyebrow>
            </motion.div>
            <motion.h1 variants={fade} custom={1} className="font-display mt-6 text-[46px] leading-[0.98] text-forest-deep sm:text-[68px] lg:text-[78px]">
              Запись в медицинский центр <em className="text-teal">Revital Park</em>
            </motion.h1>
            <motion.p variants={fade} custom={2} className="mt-7 max-w-xl text-lg leading-relaxed text-muted">
              Выберите удобное время для консультации. Система автоматически проверит расписание врача и доступность кабинета.
            </motion.p>
            <motion.div variants={fade} custom={3} className="mt-9 flex flex-wrap gap-3">
              <LinkButton href="/booking" size="lg">
                Записаться <ArrowRight size={18} />
              </LinkButton>
              <LinkButton href="/how-it-works" size="lg" variant="secondary">
                Как работает система
              </LinkButton>
            </motion.div>
            <motion.div variants={fade} custom={4} className="mt-10 flex items-center gap-4 text-sm text-muted">
              <div className="flex -space-x-3">
                {doctors?.slice(0, 4).map((d) => (
                  <DoctorPortrait key={d.id} doctor={d} className="h-10 w-10 ring-2 ring-milk" rounded="rounded-full" />
                ))}
              </div>
              <span>6 специалистов · 7 направлений</span>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto aspect-[4/5] w-full max-w-[520px]"
          >
            <div className="absolute inset-0 overflow-hidden rounded-t-[260px] rounded-b-[32px] shadow-[var(--shadow-lift)]">
              <Landscape className="h-full w-full" />
            </div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="glass absolute -left-2 top-[38%] w-[230px] rounded-3xl p-4 shadow-[var(--shadow-soft)] sm:-left-10"
            >
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal">
                <Clock size={13} /> Ближайшее время
              </div>
              <div className="font-display mt-2 text-4xl text-forest-deep">{nearest ? fmtTime(nearest.start) : "—"}</div>
              <div className="mt-1 text-sm text-muted">Терапевт · {nearest ? relativeDay(nearest.date) : "…"}</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.95, duration: 0.8 }}
              className="glass absolute -right-2 bottom-[16%] w-[240px] rounded-3xl p-4 shadow-[var(--shadow-soft)] sm:-right-8"
            >
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-forest text-milk">
                  <DoorOpen size={16} strokeWidth={1.6} />
                </span>
                <div className="text-sm leading-snug text-ink/80">
                  <b className="font-semibold text-forest-deep">Кабинет подберём сами.</b> Вам нужно выбрать только врача и время.
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* преимущества */}
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-line bg-line lg:grid-cols-4">
            {PERKS.map((p, i) => (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.6 }}
                className="bg-milk p-5 sm:p-7"
              >
                <p.icon size={24} strokeWidth={1.3} className="text-teal" />
                <div className="mt-5 text-[15.5px] font-semibold text-forest-deep">{p.title}</div>
                <div className="mt-1.5 text-sm leading-relaxed text-muted">{p.text}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* КАНАЛЫ */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <SectionTitle
            eyebrow="Одна ссылка — любой канал"
            title={<>Пациент приходит по ссылке и сразу записывается</>}
            lead="Сайт, соцсети, реклама, QR-код в номере, Telegram, MAX или SMS — запись проходит в фирменном интерфейсе Revital Park. Устанавливать стороннее приложение не нужно. Система запоминает, откуда пришёл пациент."
          />
          <div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {CHANNELS.map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                  <Link
                    href={`/booking${c.q ? `?${c.q}` : ""}`}
                    className="group flex h-full flex-col items-start gap-6 rounded-3xl border border-line bg-cream/50 p-4 transition hover:-translate-y-0.5 hover:border-teal/40 hover:bg-milk hover:shadow-[var(--shadow-soft)]"
                  >
                    <c.icon size={20} strokeWidth={1.4} className="text-teal" />
                    <span className="flex w-full items-center justify-between text-sm font-medium text-forest-deep">
                      {c.label}
                      <ArrowRight size={14} className="opacity-0 transition group-hover:opacity-100" />
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">Нажмите на канал — откроется запись с метками источника. Их увидит администратор в разделе «Источники».</p>
          </div>
        </div>
      </section>

      {/* ТРИ ПУТИ */}
      <section className="bg-cream/60 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <SectionTitle
            eyebrow="Разные пациенты — разный путь"
            title="Система понимает, кто записывается"
            lead="Гостю санатория сначала нужен терапевт: он сформирует индивидуальные назначения. Амбулаторный пациент может сразу выбрать специалиста."
          />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {PATHS.map((p, i) => (
              <motion.div key={p.path} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}>
                <Link
                  href={`/booking?path=${p.path}`}
                  className="group flex h-full flex-col rounded-[28px] border border-line bg-milk p-7 transition hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-sage-soft text-forest">
                      <p.icon size={20} strokeWidth={1.4} />
                    </span>
                    <span className="font-display text-5xl text-linen">0{i + 1}</span>
                  </div>
                  <h3 className="font-display mt-8 text-3xl text-forest-deep">{p.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-muted">{p.text}</p>
                  <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
                    <span className="text-xs font-medium text-teal">{p.tag}</span>
                    <ArrowRight size={16} className="text-forest transition group-hover:translate-x-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ВРАЧИ */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <SectionTitle eyebrow="Специалисты" title="Врачи медицинского центра" />
            <LinkButton href="/booking?path=outpatient" variant="secondary">
              Выбрать специалиста <ArrowRight size={16} />
            </LinkButton>
          </div>
        </div>
        <div className="scrollbar-none mt-12 flex snap-x gap-5 overflow-x-auto px-4 pb-4 sm:px-8 xl:px-[max(2rem,calc((100vw-80rem)/2+2rem))]">
          {doctors?.map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="w-[260px] shrink-0 snap-start sm:w-[290px]"
            >
              <DoctorPortrait doctor={d} className="aspect-[4/5] w-full" rounded="rounded-[28px]" />
              <div className="mt-4 px-1">
                <div className="font-display text-2xl leading-tight text-forest-deep">
                  {d.firstName} {d.patronymic}
                  <br />
                  {d.lastName}
                </div>
                <div className="mt-2 text-sm text-muted">{d.specialties.join(" · ")}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ЛОГИКА */}
      <section className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="relative overflow-hidden rounded-[36px] bg-forest-deep px-6 py-14 text-milk sm:px-14 sm:py-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-teal/40 blur-3xl" />
          <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <Eyebrow className="!text-sage">Главная бизнес-логика</Eyebrow>
              <h2 className="font-display mt-5 text-4xl leading-[1.05] sm:text-5xl">Свободный кабинет не означает свободного врача</h2>
              <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-sage">
                Пациент видит только то время, когда одновременно свободны врач и подходящий кабинет. После записи система блокирует их вместе.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/logic" variant="gold">
                  Посмотреть, как это работает <ArrowRight size={16} />
                </LinkButton>
                <LinkButton href="/requirements" variant="light">
                  Что нужно от МИС
                </LinkButton>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {["Врач", "Услуга", "Рабочая смена", "Кабинет", "Занятость кабинета"].map((t, i) => (
                <motion.span key={t} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="flex items-center gap-2">
                  <span className="rounded-full border border-milk/20 bg-milk/5 px-4 py-2">{t}</span>
                  <span className="text-gold">{i < 4 ? "+" : "="}</span>
                </motion.span>
              ))}
              <motion.span initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.7 }} className="rounded-full bg-gold px-5 py-2 font-semibold text-forest-deep">
                Доступный слот
              </motion.span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
