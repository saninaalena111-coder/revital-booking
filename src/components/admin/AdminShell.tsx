"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BarChart3, Boxes, CalendarRange, Database, DoorOpen, GitBranch, LayoutDashboard, MessageSquare, RefreshCw, Stethoscope, Webhook, Workflow } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { DEMO_TODAY, fmtDay, fmtWeekdayLong } from "@/lib/time";
import { Overview, DoctorsView, RoomsView, SourcesView, SmsView, IntegrationView } from "./AdminViews";
import { AdminCalendar } from "./AdminCalendar";
import { DevExchange, DevEvents, DevData, DevAlgorithm, DevStructure } from "./DevViews";

const TABS = [
  { id: "overview", label: "Дашборд", icon: LayoutDashboard, dev: false },
  { id: "calendar", label: "Календарь", icon: CalendarRange, dev: false },
  { id: "doctors", label: "Врачи", icon: Stethoscope, dev: false },
  { id: "rooms", label: "Кабинеты", icon: DoorOpen, dev: false },
  { id: "sources", label: "Источники", icon: BarChart3, dev: false },
  { id: "sms", label: "СМС-сценарии", icon: MessageSquare, dev: false },
  { id: "integration", label: "Интеграция", icon: RefreshCw, dev: false },
  // Раздел для разработчиков: вся техническая информация открыта, без сворачивания
  { id: "dev-exchange", label: "Обмен данными с МИС", icon: Database, dev: true },
  { id: "dev-events", label: "События об изменениях", icon: Webhook, dev: true },
  { id: "dev-data", label: "Структура данных", icon: Boxes, dev: true },
  { id: "dev-algorithm", label: "Алгоритм расписания", icon: Workflow, dev: true },
  { id: "dev-structure", label: "Устройство прототипа", icon: GitBranch, dev: true },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function AdminShell() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "overview") as TabId;
  const setTab = (id: TabId) => router.replace(`/admin?tab=${id}`, { scroll: false });

  return (
    <div className="min-h-screen bg-cream/50 lg:grid lg:grid-cols-[248px_1fr]">
      {/* боковая панель */}
      <aside className="hidden bg-forest-deep text-milk lg:flex lg:flex-col">
        <div className="px-6 py-6">
          <Logo light subtitle="Для сотрудников" />
        </div>
        <nav className="flex-1 space-y-1 px-3 pb-4">
          {TABS.map((t, i) => (
            <div key={t.id}>
            {t.dev && !TABS[i - 1].dev && <div className="mb-2 mt-6 px-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">Для разработчиков</div>}
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-[14px] transition ${tab === t.id ? "text-forest-deep" : "text-sage hover:bg-milk/5 hover:text-milk"}`}
            >
              {tab === t.id && <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-xl bg-milk" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
              <t.icon size={17} strokeWidth={1.5} className="relative" />
              <span className="relative text-left">{t.label}</span>
            </button>
            </div>
          ))}
        </nav>
        <div className="m-3 rounded-2xl bg-milk/5 p-4 text-xs leading-relaxed text-sage">
          Демо-режим. Данные вымышлены, МИС не подключена.
        </div>
      </aside>

      <div className="min-w-0">
        <header className="glass sticky top-0 z-40 border-b border-line">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="lg:hidden">
                <Logo subtitle="Для сотрудников" />
              </span>
              <div className="hidden text-sm text-muted lg:block">
                <span className="capitalize">{fmtWeekdayLong(DEMO_TODAY)}</span>, {fmtDay(DEMO_TODAY)} · дашборд медицинского центра
              </div>
            </div>
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-[13px] font-medium text-forest transition hover:bg-forest hover:text-milk">
              <ArrowLeft size={15} /> <span className="hidden sm:inline">Сайт для пациентов</span>
            </Link>
          </div>
          <div className="scrollbar-none flex gap-1 overflow-x-auto px-4 pb-3 lg:hidden">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] ${tab === t.id ? "bg-forest text-milk" : t.dev ? "border border-gold/50 bg-gold-soft/40 text-ink/70" : "bg-milk text-ink/70"}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-4 py-8 sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              {tab === "overview" && <Overview onOpen={setTab} />}
              {tab === "calendar" && <AdminCalendar initialDate={params.get("date") ?? DEMO_TODAY} />}
              {tab === "doctors" && <DoctorsView />}
              {tab === "rooms" && <RoomsView />}
              {tab === "sources" && <SourcesView />}
              {tab === "sms" && <SmsView />}
              {tab === "integration" && <IntegrationView onOpen={setTab} />}
              {tab === "dev-exchange" && <DevExchange />}
              {tab === "dev-events" && <DevEvents />}
              {tab === "dev-data" && <DevData />}
              {tab === "dev-algorithm" && <DevAlgorithm />}
              {tab === "dev-structure" && <DevStructure />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

export function AdminTitle({ title, lead, right }: { title: string; lead?: string; right?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl text-forest-deep sm:text-5xl">{title}</h1>
        {lead && <p className="mt-2 max-w-2xl text-[15px] text-muted">{lead}</p>}
      </div>
      {right}
    </div>
  );
}
