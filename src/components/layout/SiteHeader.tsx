"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/Logo";

const NAV = [
  { href: "/booking", label: "Записаться" },
  { href: "/how-it-works", label: "Как это работает", match: ["/how-it-works", "/logic", "/requirements"] },
  { href: "/cabinet", label: "Личный кабинет" },
];

export function SiteHeader() {
  const pathname = usePathname();
  // Меню привязано к странице, на которой его открыли: при переходе закрывается само
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const active = (n: (typeof NAV)[number]) => (n.match ?? [n.href]).some((m) => pathname.startsWith(m));

  return (
    <header className={`sticky top-0 z-50 bg-milk/90 backdrop-blur-xl transition-shadow duration-500 ${scrolled ? "shadow-[0_1px_0_rgb(226_218_203/0.9)]" : ""}`}>
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-8">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`relative rounded-full px-4 py-2 text-[14.5px] transition-colors ${active(n) ? "text-forest" : "text-ink/70 hover:text-forest"}`}
            >
              {active(n) && <motion.span layoutId="nav-dot" className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />}
              {n.label}
            </Link>
          ))}
          <Link
            href="/admin"
            className="ml-3 inline-flex items-center gap-2 rounded-full border border-forest/20 px-4 py-2 text-[13.5px] font-medium text-forest transition hover:border-forest hover:bg-forest hover:text-milk"
          >
            <LayoutDashboard size={15} strokeWidth={1.6} /> Дашборд
          </Link>
        </nav>
        <button className="grid h-10 w-10 place-items-center rounded-full border border-line md:hidden" onClick={() => setOpenOn(open ? null : pathname)} aria-label="Меню">
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-line bg-milk md:hidden"
          >
            <div className="flex flex-col gap-1 px-4 py-4">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={`rounded-2xl px-4 py-3 text-base ${active(n) ? "bg-sage-soft text-forest" : "text-ink/80"}`}>
                  {n.label}
                </Link>
              ))}
              <Link href="/admin" className="mt-2 flex items-center gap-2 rounded-2xl bg-forest px-4 py-3 text-milk">
                <LayoutDashboard size={16} /> Дашборд для сотрудников
              </Link>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
