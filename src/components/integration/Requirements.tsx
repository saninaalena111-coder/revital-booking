"use client";

import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";

const ITEMS = [
  {
    title: "API",
    text: "Нужен программный доступ к:",
    list: ["врачам", "расписанию", "кабинетам", "услугам", "пациентам", "записям"],
  },
  {
    title: "Возможность создавать и изменять записи",
    text: "Наша система должна иметь возможность передавать выбранный пациентом слот обратно в МИС — а также переносить и отменять записи.",
  },
  {
    title: "Уведомления об изменениях",
    text: "Желательно наличие webhook/event-механизма, чтобы система сразу узнавала о переносах и отменах, сделанных сотрудниками непосредственно в МИС. Если его нет — подойдёт периодическая проверка через API.",
  },
  {
    title: "Медицинские назначения",
    stage: "Второй этап",
    text: "Для расширенной версии потребуется возможность получить назначения врача для конкретного пациента.",
  },
];

export function RequirementsContent() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-8">
      <div className="mt-14 grid gap-5 md:grid-cols-2">
        {ITEMS.map((it, i) => (
          <motion.div
            key={it.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
            className={`flex flex-col rounded-[32px] p-7 sm:p-10 ${i === 3 ? "border border-dashed border-gold/70 bg-milk" : "border border-line bg-milk"}`}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="font-display text-7xl leading-none text-sage">{i + 1}</span>
              {it.stage && <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-semibold text-[#7a5a1c]">{it.stage}</span>}
            </div>
            <h2 className="font-display mt-6 text-[34px] leading-[1.05] text-forest-deep">{it.title}</h2>
            <p className="mt-4 text-[16.5px] leading-relaxed text-ink/75">{it.text}</p>
            {it.list && (
              <div className="mt-5 flex flex-wrap gap-2">
                {it.list.map((x) => (
                  <span key={x} className="rounded-full bg-sage-soft px-4 py-2 text-[15px] text-forest">
                    {x}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="mt-5 flex flex-col gap-5 rounded-[32px] bg-forest-deep p-7 text-milk sm:flex-row sm:items-center sm:p-10"
      >
        <ShieldCheck size={40} strokeWidth={1.2} className="shrink-0 text-gold" />
        <div className="font-display text-[28px] leading-tight sm:text-4xl">
          Доступ ко всей медицинской карте для обычной онлайн-записи <span className="text-gold">не требуется</span>.
        </div>
      </motion.div>

      <div className="mt-16 grid gap-5 md:grid-cols-2">
        <div className="rounded-[32px] bg-cream/70 p-7 sm:p-9">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">Почему не заменяем «Санаториум»</div>
          <p className="mt-4 text-[16px] leading-relaxed text-ink/80">
            МИС продолжает отвечать за медицинскую документацию и лечение. Новая система отвечает за клиентский путь: реклама и сайт → запись → напоминания → личный кабинет → аналитика → повторная коммуникация.
          </p>
        </div>
        <div className="flex flex-col justify-between gap-6 rounded-[32px] border border-line p-7 sm:p-9">
          <p className="text-[16px] leading-relaxed text-ink/80">Подробная схема обмена данными, перечень полей и демонстрация событий об изменениях — в разделе «Интеграция с МИС».</p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/how-it-works">
              Интеграция с МИС <ArrowRight size={16} />
            </LinkButton>
            <LinkButton href="/logic" variant="secondary">
              Логика расписания
            </LinkButton>
          </div>
        </div>
      </div>
    </div>
  );
}
