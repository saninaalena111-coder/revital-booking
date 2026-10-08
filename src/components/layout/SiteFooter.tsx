import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-cream/60">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
            Собственная система онлайн-записи Revital Park. Кликабельный прототип: все врачи, пациенты и расписание вымышлены.
          </p>
        </div>
        <FooterCol title="Пациенту" links={[["Записаться", "/booking"], ["Личный кабинет", "/cabinet"], ["Главная", "/"]]} />
        <FooterCol title="Как это работает" links={[["Логика расписания", "/logic"], ["Интеграция с МИС", "/how-it-works"], ["Что нужно от МИС", "/requirements"]]} />
        <FooterCol title="Сотрудникам" links={[["Админ-панель", "/admin"], ["Календарь дня", "/admin?tab=calendar"], ["Источники записей", "/admin?tab=sources"]]} />
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:justify-between sm:px-8">
          <span>© 2026 Revital Park · Revital Medical Booking — демонстрационный прототип</span>
          <span>Не является медицинской информационной системой</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">{title}</div>
      <ul className="space-y-2.5 text-sm">
        {links.map(([l, h]) => (
          <li key={h}>
            <Link href={h} className="text-ink/75 hover:text-forest">
              {l}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
