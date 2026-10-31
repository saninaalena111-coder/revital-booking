"use client";

import Link from "next/link";
import { BriefcaseMedical, UserRound } from "lucide-react";

/**
 * Переключатель «Глазами гостя / Глазами сотрудника»: одна и та же ситуация
 * с двух сторон продукта — личный кабинет гостя и МИС.
 */
export function ViewSwitch({
  current, guestHref = "/cabinet", staffHref = "/mis", className = "",
}: {
  current: "guest" | "staff";
  guestHref?: string;
  staffHref?: string;
  className?: string;
}) {
  const item = (active: boolean) =>
    `flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition ${
      active ? "bg-forest text-milk shadow-[0_6px_16px_-10px_rgb(30_56_54/0.8)]" : "text-ink/70 hover:text-forest"
    }`;
  return (
    <div className={`inline-flex rounded-full border border-line bg-cream/80 p-1 ${className}`} role="group" aria-label="Чьими глазами смотреть">
      <Link href={guestHref} className={item(current === "guest")} aria-current={current === "guest" ? "page" : undefined}>
        <UserRound size={14} /> Глазами гостя
      </Link>
      <Link href={staffHref} className={item(current === "staff")} aria-current={current === "staff" ? "page" : undefined}>
        <BriefcaseMedical size={14} /> Глазами сотрудника
      </Link>
    </div>
  );
}
