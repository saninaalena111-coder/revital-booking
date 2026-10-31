"use client";

import { ChefHat, ClipboardCheck, Printer, Search, UtensilsCrossed } from "lucide-react";
import { useState } from "react";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { catalogService, mealsService, patientFullName, RESTAURANT_LABEL, TOMORROW, type MealGuest } from "@/services";
import { fmtDay, fmtWeekdayLong } from "@/lib/time";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { ComingSoonButton } from "../ComingSoon";
import { MisTitle } from "../MisShell";
import { card, CourseBar, EmptyState, Loading, Stat, StatusPill, useToast } from "../ui";
import { MealOrderEditor } from "./MealOrderEditor";

type Tab = "kitchen" | "orders" | "tables";

/** Питание: сводка для кухни на завтра, заказы гостей «А-ля карт», диетстолы */
export function Meals() {
  const { sanatoriumId, tenant } = useSession();
  const [tab, setTab] = useState<Tab>("kitchen");
  const san = tenant.sanatoriums.find((s) => s.id === "gelendzhik")!;

  return (
    <>
      <MisTitle
        title="Питание"
        lead={<>Заказы на завтра, <span className="lowercase">{fmtWeekdayLong(TOMORROW)}</span>, {fmtDay(TOMORROW)}. Гости ресторана «А-ля карт» заказывают блюда по своему диетстолу, «Шведскому столу» кухня готовит по количеству гостей на каждом столе.</>}
        right={<ComingSoonButton feature="print" variant="secondary"><Printer size={16} /> Печать для кухни</ComingSoonButton>}
      />
      {sanatoriumId !== "gelendzhik" && sanatoriumId !== "all" ? (
        <EmptyState icon={UtensilsCrossed} title="Питание объекта ещё не подключено" text="В демо модуль питания заполнен для Ревиталь Парк Геленджик. Другие объекты подключаются так же." />
      ) : (
        <>
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
          {tab === "kitchen" && <Kitchen />}
          {tab === "orders" && <Orders />}
          {tab === "tables" && <Tables />}
        </>
      )}
    </>
  );
}

function Kitchen() {
  const { data } = useService(() => mealsService.kitchen(), []);
  if (!data) return <Loading />;
  const { alacarte, buffet } = data;
  const meals = [["breakfast", "Завтрак"], ["lunch", "Обед"], ["dinner", "Ужин"]] as const;
  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <div className={`${card} p-5`}>
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-[18px] font-semibold text-forest-deep">«{RESTAURANT_LABEL.alacarte}» — порции</h2>
          <span className="text-[14px] text-muted">{alacarte.ordered} из {alacarte.guests} гостей заказали</span>
        </div>
        <CourseBar done={alacarte.ordered} total={alacarte.guests} className="mt-3" />
        {meals.map(([kind, title]) => {
          const list = alacarte.dishes.filter((d) => d.dish.meal === kind);
          return (
            <section key={kind} className="mt-5">
              <h3 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.14em] text-teal">{title}</h3>
              {!list.length ? (
                <p className="text-[14px] text-muted">Заказов нет</p>
              ) : (
                <ul className="divide-y divide-line">
                  {list.map((d) => (
                    <li key={d.dish.id} className="flex items-center justify-between gap-3 py-2 text-[15px]">
                      <span className="text-ink/85">{d.dish.title}</span>
                      <span className="font-display text-[24px] leading-none text-forest-deep tabular-nums">{d.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
      <div className="space-y-6">
        <div className={`${card} p-5`}>
          <h2 className="text-[18px] font-semibold text-forest-deep">«{RESTAURANT_LABEL.buffet}» — гости по столам</h2>
          <p className="mt-1 text-[14px] text-muted">Всего гостей завтра: {buffet.guests}</p>
          <TableBars rows={buffet.byTable} total={buffet.guests} />
        </div>
        <div className={`${card} p-5`}>
          <h2 className="text-[18px] font-semibold text-forest-deep">«{RESTAURANT_LABEL.alacarte}» — гости по столам</h2>
          <TableBars rows={alacarte.byTable} total={alacarte.guests} />
        </div>
      </div>
    </div>
  );
}

function TableBars({ rows, total }: { rows: { table: { id: string; title: string }; count: number }[]; total: number }) {
  return (
    <ul className="mt-4 space-y-3">
      {rows.map((r) => (
        <li key={r.table.id}>
          <div className="flex justify-between text-[14px]"><span className="text-ink/85">{r.table.title}</span><b className="tabular-nums text-forest-deep">{r.count}</b></div>
          <div className="mt-1 h-2 rounded-full bg-cream"><div className="h-full rounded-full bg-teal" style={{ width: `${(r.count / Math.max(1, total)) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Orders() {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "missing">("all");
  const [edit, setEdit] = useState<MealGuest | null>(null);
  const toast = useToast();
  const { data } = useService(() => mealsService.guests(TOMORROW), []);
  if (!data) return <Loading />;
  const rows = data
    .filter((g) => g.restaurant === "alacarte")
    .filter((g) => only === "all" || !g.order)
    .filter((g) => !q || `${patientFullName(g.patient)} ${g.roomNumber}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented size="sm" value={only} onChange={setOnly} options={[{ value: "all", label: "Все гости «А-ля карт»" }, { value: "missing", label: "Не заказали" }]} />
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
            <li key={g.patient.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-medium text-forest-deep">{patientFullName(g.patient)}</div>
                <div className="text-[13.5px] text-muted">№ {g.roomNumber} · {g.table.title}</div>
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
        {edit && (
          <>
            <p className="-mt-2 mb-5 text-[15px] text-muted">{patientFullName(edit.patient)} · № {edit.roomNumber} · {edit.table.title}. Показаны только блюда, подходящие диетстолу.</p>
            <MealOrderEditor
              tableId={edit.table.id}
              initial={edit.order?.dishIds ?? []}
              onSave={async (ids) => {
                await mealsService.setOrder(edit.patient.id, TOMORROW, ids);
                toast.show(`Заказ ${edit.patient.lastName} сохранён`);
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

function Tables() {
  const { data } = useService(() => mealsService.guests(TOMORROW), []);
  if (!data) return <Loading />;
  return (
    <>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Гостей завтра" value={data.length} />
        <Stat label="«А-ля карт»" value={data.filter((g) => g.restaurant === "alacarte").length} />
        <Stat label="«Шведский стол»" value={data.filter((g) => g.restaurant === "buffet").length} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {catalogService.dietTables().map((t) => {
          const guests = data.filter((g) => g.table.id === t.id);
          return (
            <div key={t.id} className={`${card} p-5`}>
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-[16px] font-semibold text-forest-deep">{t.title}</h3>
                <span className="font-display text-[28px] leading-none text-forest-deep">{guests.length}</span>
              </div>
              <p className="mt-1 text-[14px] text-muted">{t.description}</p>
              <p className="mt-3 text-[13px] text-ink/70">{guests.slice(0, 4).map((g) => g.patient.lastName).join(", ")}{guests.length > 4 && ` и ещё ${guests.length - 4}`}</p>
            </div>
          );
        })}
      </div>
    </>
  );
}
