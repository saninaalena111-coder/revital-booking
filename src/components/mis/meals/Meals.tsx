"use client";

import { ChefHat, ClipboardCheck, Search, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import type { SanatoriumId } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { catalogService, mealsService, TOMORROW, type MealGuest } from "@/services";
import { fmtDay, fmtWeekdayLong } from "@/lib/time";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { PrintButton, PrintKitchen } from "../print/Print";
import { MisTitle } from "../MisShell";
import { card, CourseBar, EmptyState, Loading, Stat, StatusPill, useToast } from "../ui";
import { MealOrderEditor } from "./MealOrderEditor";

type Tab = "kitchen" | "orders" | "tables";

/** Питание: сводка для кухни на завтра по залам санатория, заказы гостей, диетстолы */
export function Meals() {
  const { sanatoriumId, tenant } = useSession();
  const [tab, setTab] = useState<Tab>("kitchen");
  // «Все санатории» — показываем основной объект; кухня у каждого санатория своя
  const san = tenant.sanatoriums.find((s) => s.id === (sanatoriumId === "all" ? tenant.primary : sanatoriumId))!;

  if (san.kind === "spa") {
    return (
      <>
        <MisTitle title="Питание" lead="Сводка для кухни и заказы гостей на завтра." />
        <EmptyState icon={UtensilsCrossed} title="В СПА-клубе нет питания гостей" text="Выберите санаторий в шапке — у каждого свои залы и своя кухня." />
      </>
    );
  }

  return (
    <>
      <MisTitle
        title="Питание"
        lead={<>{san.title}: заказы на завтра, <span className="lowercase">{fmtWeekdayLong(TOMORROW)}</span>, {fmtDay(TOMORROW)}. Кухня готовит на всех проживающих: гостям с медкартой диетстол назначает врач, остальным — общий стол №15.</>}
        right={<PrintButton label="Печать для кухни" make={async () => <PrintKitchen title={san.title} date={TOMORROW} kitchen={await mealsService.kitchen(TOMORROW, san.id)} />} />}
      />
      {sanatoriumId === "all" && <p className="-mt-4 mb-5 text-[14px] text-muted">Выбрана вся сеть — показываем {san.title}. Другой объект выберите в шапке.</p>}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {san.restaurants.map((r) => (
          <div key={r.id} className={`${card} flex items-start gap-3 p-4`}>
            <ChefHat size={20} className="mt-0.5 shrink-0 text-teal" />
            <div>
              <div className="text-[15px] font-semibold text-forest-deep">«{r.title}» · {r.seats} мест</div>
              <div className="text-[13.5px] text-muted">{r.note}. Завтрак {san.meals.breakfast}, обед {san.meals.lunch}, ужин {san.meals.dinner}.</div>
            </div>
          </div>
        ))}
      </div>
      <Segmented
        className="mb-6"
        value={tab}
        onChange={setTab}
        options={[
          { value: "kitchen", label: "Сводка для кухни" },
          { value: "orders", label: "Заказы гостей" },
          { value: "tables", label: "Диетстолы" },
        ]}
      />
      {tab === "kitchen" && <Kitchen san={san.id} />}
      {tab === "orders" && <Orders san={san.id} />}
      {tab === "tables" && <Tables san={san.id} />}
    </>
  );
}

function Kitchen({ san }: { san: SanatoriumId }) {
  const { data } = useService(() => mealsService.kitchen(TOMORROW, san), [san]);
  if (!data) return <Loading />;
  const meals = [["breakfast", "Завтрак"], ["lunch", "Обед"], ["dinner", "Ужин"]] as const;
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {data.map((k) => (
        <div key={k.restaurant.id} className={`${card} p-5`}>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-[18px] font-semibold text-forest-deep">«{k.restaurant.title}»</h2>
            <span className="text-[14px] text-muted">гостей завтра: <b className="text-forest-deep">{k.persons}</b></span>
          </div>
          <h3 className="mb-2 mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-teal">Гости по диетстолам</h3>
          <TableBars rows={k.byTable} total={k.persons} />
          {k.restaurant.preorder && (
            <>
              <div className="mt-6 flex items-baseline justify-between gap-3">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-teal">Предзаказ блюд</h3>
                <span className="text-[13.5px] text-muted">заказали {k.ordered} из {k.orderGuests} гостей с медкартой</span>
              </div>
              <CourseBar done={k.ordered} total={k.orderGuests} className="mt-2" />
              {meals.map(([kind, title]) => {
                const list = k.dishes.filter((d) => d.dish.meal === kind);
                return (
                  <section key={kind} className="mt-4">
                    <h4 className="mb-1 text-[14px] font-semibold text-forest-deep">{title}</h4>
                    {!list.length ? (
                      <p className="text-[14px] text-muted">Заказов нет</p>
                    ) : (
                      <ul className="divide-y divide-line">
                        {list.map((d) => (
                          <li key={d.dish.id} className="flex items-center justify-between gap-3 py-1.5 text-[14.5px]">
                            <span className="text-ink/85">{d.dish.title}</span>
                            <span className="font-display text-[22px] leading-none tabular-nums text-forest-deep">{d.count}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                );
              })}
              <p className="mt-3 text-[12.5px] text-muted">Гости без медкарты выбирают блюда из меню ресторана на месте.</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function TableBars({ rows, total }: { rows: { table: { id: string; title: string }; count: number }[]; total: number }) {
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.table.id}>
          <div className="flex justify-between text-[14px]"><span className="text-ink/85">{r.table.title}</span><b className="tabular-nums text-forest-deep">{r.count}</b></div>
          <div className="mt-1 h-2 rounded-full bg-cream"><div className="h-full rounded-full bg-teal" style={{ width: `${(r.count / Math.max(1, total)) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Orders({ san }: { san: SanatoriumId }) {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "missing">("all");
  const [edit, setEdit] = useState<MealGuest | null>(null);
  const toast = useToast();
  const { data } = useService(() => mealsService.guests(TOMORROW, san), [san]);
  if (!data) return <Loading />;
  // Предзаказ — только в ресторанах с заказом на завтра и только у гостей с диетстолом от врача
  const base = data.filter((g) => g.restaurant.preorder && g.patient);
  if (!base.length) {
    return <EmptyState icon={ClipboardCheck} title="В этом санатории блюда заранее не заказывают" text="Кухня готовит по числу гостей на каждом диетстоле — смотрите «Сводку для кухни»." />;
  }
  const rows = base
    .filter((g) => only === "all" || !g.order)
    .filter((g) => !q || `${g.name} ${g.roomNumber}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented size="sm" value={only} onChange={setOnly} options={[{ value: "all", label: "Все с предзаказом" }, { value: "missing", label: "Не заказали" }]} />
        <label className="relative block sm:w-72">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Фамилия или номер" className="h-11 w-full rounded-full border border-line bg-milk pl-10 pr-4 text-[15px] outline-none focus:border-forest/50" />
        </label>
      </div>
      {!rows.length ? (
        <EmptyState icon={ClipboardCheck} title="Все гости сделали заказ" text="Можно передавать сводку на кухню." />
      ) : (
        <ul className={`${card} divide-y divide-line`}>
          {rows.map((g) => (
            <li key={g.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-medium text-forest-deep">{g.name}</div>
                <div className="text-[13.5px] text-muted">№ {g.roomNumber} · «{g.restaurant.title}» · {g.table.title}</div>
                {g.order && <div className="mt-1 text-[13px] text-ink/70">{g.order.dishIds.map((id) => catalogService.dish(id).title).join(" · ")}</div>}
              </div>
              {g.order ? <StatusPill tone="ok" icon={ClipboardCheck}>Заказано</StatusPill> : <StatusPill tone="gold">Не заказано</StatusPill>}
              <button onClick={() => setEdit(g)} className="min-h-10 rounded-full border border-forest/25 px-4 text-[14px] font-medium text-forest hover:border-forest">
                {g.order ? "Изменить" : "Заказать за гостя"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit ? `Заказ на ${fmtDay(TOMORROW)}` : ""}>
        {edit?.patient && (
          <>
            <p className="-mt-2 mb-5 text-[15px] text-muted">{edit.name} · № {edit.roomNumber} · {edit.table.title}. Показаны только блюда, подходящие диетстолу.</p>
            <MealOrderEditor
              tableId={edit.table.id}
              initial={edit.order?.dishIds ?? []}
              onSave={async (ids) => {
                await mealsService.setOrder(edit.patient!.id, TOMORROW, ids);
                toast.show(`Заказ ${edit.name} сохранён`);
                setEdit(null);
              }}
            />
          </>
        )}
      </Modal>
      {toast.node}
    </>
  );
}

function Tables({ san }: { san: SanatoriumId }) {
  const { data } = useService(() => mealsService.guests(TOMORROW, san), [san]);
  if (!data) return <Loading />;
  const persons = (list: MealGuest[]) => list.reduce((s, g) => s + g.persons, 0);
  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Гостей завтра" value={persons(data)} />
        <Stat label="Диетстол от врача" value={persons(data.filter((g) => g.patient))} />
        <Stat label="Общий стол №15" value={persons(data.filter((g) => !g.patient))} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalogService.dietTables().map((t) => {
          const guests = data.filter((g) => g.table.id === t.id);
          return (
            <div key={t.id} className={`${card} p-5`}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[16px] font-semibold text-forest-deep">{t.title}</h3>
                <span className="font-display text-[28px] leading-none text-forest-deep">{persons(guests)}</span>
              </div>
              <p className="mt-1 text-[14px] text-muted">{t.description}</p>
              <p className="mt-3 text-[13px] text-ink/70">{guests.slice(0, 4).map((g) => g.name.split(" ")[0]).join(", ")}{guests.length > 4 && ` и ещё ${guests.length - 4}`}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
