"use client";

import { Lock, ShieldCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { SECTIONS, type SectionId } from "@/config/roles";
import { useSession } from "@/hooks/useSession";
import { auditService } from "@/services";
import { LinkButton } from "@/components/ui/Button";

/**
 * Экран-объяснение принципа минимального доступа.
 * Сотрудник видит только разделы своей роли, а медицинские данные — только медперсонал.
 */
export function NoAccess({ section, home }: { section: SectionId; home: string }) {
  const { role } = useSession();
  const medical = SECTIONS[section].medical;
  const logged = useRef(false);

  // Попытка открыть закрытый раздел попадает в журнал действий
  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    auditService.log("denied", `Попытка открыть раздел «${SECTIONS[section].title}» — нет доступа`);
  }, [section]);
  return (
    <div className="mx-auto max-w-xl py-10 text-center sm:py-16">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-sage-soft text-forest">
        <Lock size={26} strokeWidth={1.5} />
      </span>
      <h1 className="font-display mt-6 text-[34px] leading-tight text-forest-deep sm:text-[42px]">
        {medical ? "Нет доступа к медицинским данным" : "Раздел не входит в вашу роль"}
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-muted">
        {medical
          ? "Так защищаются данные гостей: медицинские карты, диагнозы и назначения видят только врачи и медсёстры."
          : `Роль «${role?.title}» не работает с разделом «${SECTIONS[section].title}». Каждый сотрудник видит только то, что нужно для его работы.`}
      </p>
      <div className="mx-auto mt-6 flex max-w-md gap-3 rounded-2xl bg-milk p-4 text-left text-[14px] text-ink/80 shadow-[var(--shadow-soft)]">
        <ShieldCheck size={18} className="mt-0.5 shrink-0 text-forest" />
        <span>Попытка открыть раздел записана в журнал действий. Если доступ нужен для работы, его выдаёт администратор системы.</span>
      </div>
      <LinkButton href={home} className="mt-8">
        Вернуться на мой экран
      </LinkButton>
    </div>
  );
}
