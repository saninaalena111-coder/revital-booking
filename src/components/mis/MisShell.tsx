"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart3, BedDouble, CalendarClock, CalendarHeart, Check, ChevronDown, ClipboardCheck, DoorOpen, FileCheck2, LifeBuoy, Loader2,
  LogOut, Megaphone, Menu, ShieldCheck, Sun, Syringe, Ticket, UsersRound, UtensilsCrossed, X, type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { canOpen, ROLES, SECTIONS, type RoleId, type SectionId } from "@/config/roles";
import { brandStyle } from "@/config/tenant";
import { useSession } from "@/hooks/useSession";
import { sessionService, staffShortName } from "@/services";
import { DEMO_TODAY, fmtDay, fmtWeekdayLong } from "@/lib/time";
import { TenantLogo } from "./TenantLogo";
import { NoAccess } from "./NoAccess";
import { ViewSwitch } from "./ViewSwitch";
import { Assistant } from "./help/Assistant";

export const SECTION_ICONS: Record<SectionId, LucideIcon> = {
  today: Sun,
  patients: UsersRound,
  procedures: Syringe,
  rooms: DoorOpen,
  egisz: FileCheck2,
  stays: BedDouble,
  bookings: Ticket,
  meals: UtensilsCrossed,
  records: CalendarClock,
  analytics: BarChart3,
  sources: Megaphone,
  admin: ShieldCheck,
  help: LifeBuoy,
  reports: ClipboardCheck,
};

/** Внутренние экраны, у которых нет своего пункта меню, относятся к разделу */
const EXTRA_ROUTES: Record<string, SectionId> = {
  "/mis/patient": "patients",
  "/mis/reception": "today",
};

function sectionFor(pathname: string): SectionId | null {
  const path = pathname.replace(/\/$/, "");
  if (EXTRA_ROUTES[path]) return EXTRA_ROUTES[path];
  return (Object.values(SECTIONS).find((s) => path === s.href)?.id as SectionId) ?? null;
}

export function MisShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const s = useSession();
  const [drawerOn, setDrawerOn] = useState<string | null>(null);
  const drawer = drawerOn === pathname;
  const as = params.get("as") as RoleId | null;

  // Ссылки демо-сценариев открывают экран сразу под нужной ролью: /mis/today?as=doctor
  useEffect(() => {
    sessionService.hydrate();
    if (as && ROLES.some((r) => r.id === as)) sessionService.signIn(as);
  }, [as]);

  const isLogin = pathname.replace(/\/$/, "") === "/mis";
  const style = brandStyle(s.tenant);

  if (isLogin) return <div style={style} className="min-h-screen bg-milk">{children}</div>;

  if (!s.ready || (as && s.role?.id !== as)) {
    return (
      <div style={style} className="grid min-h-screen place-items-center bg-cream/50 text-muted">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!s.role) {
    return (
      <div style={style} className="grid min-h-screen place-items-center bg-cream/50 px-4 text-center">
        <div>
          <TenantLogo tenant={s.tenant} subtitle="Для сотрудников" />
          <p className="mt-8 text-lg text-ink/80">Чтобы открыть этот экран, войдите в систему.</p>
          <Link href="/mis" className="mt-5 inline-flex h-12 items-center rounded-full bg-forest px-7 font-medium text-milk">
            Войти
          </Link>
        </div>
      </div>
    );
  }

  const role = s.role;
  const section = sectionFor(pathname);
  const allowed = !section || canOpen(role.id, section);
  const home = SECTIONS[role.start].href;
  const signOut = () => {
    sessionService.signOut();
    router.push("/mis");
  };

  const nav = (onDark: boolean) => (
    <nav className="space-y-1">
      {role.menu.map((id) => {
        const sec = SECTIONS[id];
        const Icon = SECTION_ICONS[id];
        const active = section === id;
        return (
          <Link
            key={id}
            href={sec.href}
            className={`relative flex min-h-11 items-center gap-3 rounded-xl px-4 py-2.5 text-[15px] transition ${
              active
                ? onDark ? "text-forest-deep" : "bg-forest text-milk"
                : onDark ? "text-sage hover:bg-milk/5 hover:text-milk" : "text-ink/80 hover:bg-cream"
            }`}
          >
            {active && onDark && <motion.span layoutId="mis-nav" className="absolute inset-0 rounded-xl bg-milk" transition={{ type: "spring", bounce: 0.15, duration: 0.5 }} />}
            <Icon size={18} strokeWidth={1.5} className="relative shrink-0" />
            <span className="relative">{sec.title}</span>
          </Link>
        );
      })}
    </nav>
  );

  const userCard = (onDark: boolean) =>
    s.user && (
      <div className={`flex items-center gap-3 rounded-2xl p-3 ${onDark ? "bg-milk/5" : "bg-cream"}`}>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-semibold ${onDark ? "bg-sage text-forest-deep" : "bg-forest text-milk"}`}>
          {s.user.lastName[0]}{s.user.firstName[0]}
        </span>
        <span className="min-w-0 leading-tight">
          <span className={`block truncate text-[14px] font-medium ${onDark ? "text-milk" : "text-forest-deep"}`}>{staffShortName(s.user)}</span>
          <span className={`block truncate text-[12px] ${onDark ? "text-sage" : "text-muted"}`}>{role.title}</span>
        </span>
      </div>
    );

  return (
    <div style={style} className="min-h-screen bg-cream/50 lg:grid lg:grid-cols-[264px_1fr] print:block print:bg-white">
      {/* боковая панель */}
      <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto bg-forest-deep text-milk lg:flex print:hidden">
        <div className="px-6 pb-5 pt-6">
          <TenantLogo tenant={s.tenant} light subtitle="Для сотрудников" href={home} />
        </div>
        <div className="px-3">{userCard(true)}</div>
        <div className="flex-1 px-3 py-5">{nav(true)}</div>
        <div className="space-y-2 px-3 pb-4">
          <button onClick={signOut} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-[14px] text-sage hover:bg-milk/5 hover:text-milk">
            <LogOut size={17} strokeWidth={1.5} /> Сменить роль
          </button>
          <div className="rounded-2xl bg-milk/5 p-4 text-xs leading-relaxed text-sage">Демо-режим. Все люди и данные вымышлены.</div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="glass sticky top-0 z-40 border-b border-line print:hidden">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-line bg-milk lg:hidden"
                onClick={() => setDrawerOn(pathname)}
                aria-label="Открыть меню"
              >
                <Menu size={19} />
              </button>
              {/* Демо-день фиксирован, чтобы все сценарии показывали одно и то же */}
              <div className="hidden items-center gap-2 text-sm text-muted xl:flex" title="Демо-день: все сценарии показаны на 12 октября 2026, 10:40">
                <span><span className="capitalize">{fmtWeekdayLong(DEMO_TODAY)}</span>, {fmtDay(DEMO_TODAY)}</span>
                <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-[#7a5a1c]">демо-день</span>
              </div>
              <SanatoriumSwitch />
            </div>
            <div className="hidden shrink-0 md:block">
              <ViewSwitch current="staff" />
            </div>
          </div>
        </header>

        <div className="px-4 pb-28 pt-6 sm:px-8 sm:pt-8">
          {allowed ? children : <NoAccess section={section!} home={home} />}
        </div>
      </div>

      <Assistant />

      {/* меню на телефоне и планшете */}
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[58] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-forest-deep/30 backdrop-blur-sm" onClick={() => setDrawerOn(null)} />
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", bounce: 0.1, duration: 0.45 }}
              className="absolute inset-y-0 left-0 flex w-[min(320px,88vw)] flex-col overflow-y-auto bg-milk p-4 shadow-[var(--shadow-lift)]"
            >
              <div className="mb-4 flex items-center justify-between">
                <TenantLogo tenant={s.tenant} subtitle="Для сотрудников" href={home} />
                <button onClick={() => setDrawerOn(null)} aria-label="Закрыть меню" className="grid h-10 w-10 place-items-center rounded-full border border-line">
                  <X size={17} />
                </button>
              </div>
              {userCard(false)}
              <div className="flex-1 py-4">{nav(false)}</div>
              <ViewSwitch current="staff" className="mb-3 w-full" />
              <button onClick={signOut} className="flex min-h-11 items-center gap-3 rounded-xl px-4 text-[15px] text-ink/80 hover:bg-cream">
                <LogOut size={17} strokeWidth={1.5} /> Сменить роль
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Переключатель санатория в шапке: «Все санатории» + каждый объект сети */
function SanatoriumSwitch() {
  const s = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const options = [{ id: "all" as const, title: "Вся сеть", sub: `${s.tenant.brand.name}: 4 санатория и 2 СПА-клуба` }, ...s.tenant.sanatoriums.map((x) => ({ id: x.id, title: x.title, sub: x.kind === "spa" ? `${x.city} · СПА-клуб, без проживания` : `${x.city} · ${x.stars}★` }))];
  const current = options.find((o) => o.id === s.sanatoriumId) ?? options[0];

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 min-w-0 max-w-full items-center gap-2 rounded-full border border-line bg-milk pl-4 pr-3 text-[14px] font-medium text-forest-deep hover:border-forest/40"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <CalendarHeart size={16} strokeWidth={1.6} className="shrink-0 text-teal" />
        <span className="truncate">{current.title}</span>
        <ChevronDown size={15} className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="fixed inset-x-4 top-[68px] z-50 rounded-2xl sm:absolute sm:inset-x-auto sm:left-0 sm:top-12 sm:w-80 border border-line bg-milk p-1.5 shadow-[var(--shadow-lift)]"
          >
            {options.map((o) => (
              <li key={o.id}>
                <button
                  role="option"
                  aria-selected={o.id === current.id}
                  onClick={() => {
                    sessionService.setSanatorium(o.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-cream"
                >
                  <span>
                    <span className="block text-[14.5px] font-medium text-forest-deep">{o.title}</span>
                    <span className="block text-[12.5px] text-muted">{o.sub}</span>
                  </span>
                  {o.id === current.id && <Check size={16} className="shrink-0 text-forest" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Заголовок экрана МИС: название + одна строка пояснения */
export function MisTitle({ title, lead, right }: { title: string; lead?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="font-display text-[34px] leading-tight text-forest-deep sm:text-[42px]">{title}</h1>
        {lead && <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-muted">{lead}</p>}
      </div>
      {right && <div className="flex shrink-0 flex-wrap gap-2">{right}</div>}
    </div>
  );
}
