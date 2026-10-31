"use client";

import { Check, Coffee, Moon, Soup } from "lucide-react";
import { useState } from "react";
import type { MealKind } from "@/lib/types";
import { catalogService, mealsService } from "@/services";
import { Button } from "@/components/ui/Button";

export const MEALS: { kind: MealKind; title: string; icon: typeof Coffee; time: string }[] = [
  { kind: "breakfast", title: "Завтрак", icon: Coffee, time: "08:00–10:00" },
  { kind: "lunch", title: "Обед", icon: Soup, time: "13:00–15:00" },
  { kind: "dinner", title: "Ужин", icon: Moon, time: "18:00–20:00" },
];

/**
 * Выбор блюд на день по диетстолу: показываются только подходящие блюда.
 * Используется и диетсестрой в МИС, и гостем в личном кабинете (крупнее).
 */
export function MealOrderEditor({
  tableId, initial, onSave, big = false, saveLabel = "Сохранить заказ",
}: {
  tableId: string;
  initial: string[];
  onSave: (dishIds: string[]) => Promise<void> | void;
  big?: boolean;
  saveLabel?: string;
}) {
  const [picked, setPicked] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const menu = mealsService.menuFor(tableId);
  const kcal = picked.reduce((s, id) => s + catalogService.dish(id).kcal, 0);
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const missing = MEALS.filter((m) => !menu.some((d) => d.meal === m.kind && picked.includes(d.id)));

  return (
    <div>
      <div className="space-y-5">
        {MEALS.map((m) => (
          <section key={m.kind}>
            <h4 className={`mb-2 flex items-center gap-2 font-semibold text-forest-deep ${big ? "text-[18px]" : "text-[15px]"}`}>
              <m.icon size={big ? 20 : 17} className="text-teal" /> {m.title}
              <span className="text-[13px] font-normal text-muted">{m.time}</span>
            </h4>
            <div className={`grid gap-2 ${big ? "sm:grid-cols-2" : "sm:grid-cols-2"}`}>
              {menu.filter((d) => d.meal === m.kind).map((d) => {
                const on = picked.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggle(d.id)}
                    aria-pressed={on}
                    className={`flex items-center gap-3 rounded-2xl border px-4 text-left transition ${big ? "min-h-16 py-3 text-[16px]" : "min-h-12 py-2 text-[14.5px]"} ${on ? "border-forest bg-forest text-milk" : "border-line bg-white hover:border-forest/40"}`}
                  >
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border ${on ? "border-milk bg-milk text-forest" : "border-line"}`}>{on && <Check size={14} />}</span>
                    <span className="min-w-0 flex-1 leading-snug">{d.title}</span>
                    <span className={`shrink-0 text-[12px] ${on ? "text-sage" : "text-muted"}`}>{d.kcal} ккал</span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-cream/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[14px] text-ink/80">
          Выбрано блюд: <b>{picked.length}</b> · {kcal} ккал
          {missing.length > 0 && <div className="text-[13px] text-muted">Не выбрано: {missing.map((m) => m.title.toLowerCase()).join(", ")}</div>}
        </div>
        <Button
          size={big ? "lg" : "md"}
          disabled={!picked.length || busy}
          onClick={async () => {
            setBusy(true);
            await onSave(picked);
            setBusy(false);
          }}
        >
          <Check size={17} /> {saveLabel}
        </Button>
      </div>
    </div>
  );
}
