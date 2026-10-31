"use client";

import { CalendarPlus, ChevronRight, Download, Search, Ticket } from "lucide-react";
import { useState } from "react";
import type { PaymentStatus, SanatoriumId, Stay } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { catalogService, staysService } from "@/services";
import { addDays, dayNum, DEMO_TODAY, fmtDay, nightsBetween } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { ComingSoonButton } from "../ComingSoon";
import { MisTitle } from "../MisShell";
import { card, EmptyState, Loading, Stat, useToast } from "../ui";
import { NewStayModal, PaymentPill, rub, StayModal, StayStatusPill, type NewStayDraft } from "./StayModals";

type Pay = PaymentStatus | "all";

/** Брони и путёвки: будущие заезды на 30 дней, оплата, создание брони */
export function Bookings() {
  const { sanatoriumId, sanatorium } = useSession();
  const [pay, setPay] = useState<Pay>("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Stay | null>(null);
  const [draft, setDraft] = useState<NewStayDraft | null>(null);
  const toast = useToast();
  const until = addDays(DEMO_TODAY, 30);
  const { data } = useService(
    async () => (await staysService.list(sanatoriumId as SanatoriumId | "all", DEMO_TODAY, until)).filter((s) => s.status === "booked" && s.from >= DEMO_TODAY),
    [sanatoriumId],
  );

  const rows = (data ?? [])
    .filter((s) => pay === "all" || s.payment === pay)
    .filter((s) => !q || `${s.guestName} ${staysService.roomById(s.hotelRoomId)?.number}`.toLowerCase().includes(q.toLowerCase()));
  const total = data?.reduce((s, x) => s + x.amountRub, 0) ?? 0;
  const debt = data?.reduce((s, x) => s + x.amountRub - x.paidRub, 0) ?? 0;

  return (
    <>
      <MisTitle
        title="Брони и путёвки"
        lead={`${sanatorium?.title ?? "Все санатории"}: заезды на ближайшие 30 дней. Нажмите на бронь, чтобы открыть карточку.`}
        right={
          <>
            <ComingSoonButton feature="export" variant="ghost"><Download size={16} /> Выгрузить</ComingSoonButton>
            <Button onClick={() => setDraft({})}><CalendarPlus size={17} /> Новая бронь</Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Броней на 30 дней" value={data?.length ?? "—"} />
        <Stat label="Заезды завтра" value={data?.filter((s) => s.from === addDays(DEMO_TODAY, 1)).length ?? "—"} tone="gold" />
        <Stat label="Сумма броней" value={data ? `${(total / 1_000_000).toFixed(1).replace(".", ",")} млн ₽` : "—"} />
        <Stat label="Ожидает оплаты" value={data ? `${(debt / 1_000_000).toFixed(1).replace(".", ",")} млн ₽` : "—"} tone="danger" />
      </div>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={pay}
          onChange={setPay}
          options={[
            { value: "all", label: "Все" },
            { value: "unpaid", label: "Не оплачено" },
            { value: "partial", label: "Предоплата" },
            { value: "paid", label: "Оплачено" },
          ]}
        />
        <label className="relative block lg:w-80">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Фамилия гостя или номер" className="h-12 w-full rounded-full border border-line bg-milk pl-11 pr-4 text-[15px] outline-none focus:border-forest/50" />
        </label>
      </div>

      {!data ? (
        <Loading />
      ) : !rows.length ? (
        <EmptyState icon={Ticket} title="Броней не нашли" text={sanatorium?.placeholder ? "Данные этого объекта ещё не загружены." : "Измените фильтр или создайте новую бронь."} />
      ) : (
        <ul className={`${card} divide-y divide-line overflow-hidden`}>
          {rows.slice(0, 80).map((s) => {
            const room = staysService.roomById(s.hotelRoomId);
            return (
              <li key={s.id}>
                <button onClick={() => setOpen(s)} className="group flex w-full flex-col gap-2 p-4 text-left hover:bg-cream/40 md:flex-row md:items-center md:gap-5 md:px-5">
                  <div className="w-20 shrink-0">
                    <div className="font-display text-[26px] leading-none text-forest-deep">{dayNum(s.from)}</div>
                    <div className="text-[12px] text-muted">{fmtDay(s.from).split(" ")[1]}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[15.5px] font-medium text-forest-deep">{s.guestName}</div>
                    <div className="text-[13.5px] text-muted">
                      № {room?.number} · {nightsBetween(s.from, s.to)} ноч. до {fmtDay(s.to)} · {catalogService.program(s.programId).title} · {s.source}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StayStatusPill stay={s} />
                    <PaymentPill status={s.payment} />
                    <span className="w-28 text-right text-[14.5px] font-medium tabular-nums text-forest-deep">{rub(s.amountRub)}</span>
                    <ChevronRight size={18} className="hidden text-muted md:block" />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {rows.length > 80 && <p className="mt-3 text-[13px] text-muted">Показаны первые 80 броней — уточните поиск.</p>}

      <StayModal stay={open} onClose={() => setOpen(null)} onDone={toast.show} />
      <NewStayModal draft={draft} onClose={() => setDraft(null)} onDone={toast.show} />
      {toast.node}
    </>
  );
}
