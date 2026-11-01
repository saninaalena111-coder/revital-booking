"use client";

import { BedDouble, CalendarPlus, LogIn, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import type { ISODate, RoomDayState, SanatoriumId, Stay } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { ROOM_STATE_LABEL, staysService, type GridRow } from "@/services";
import { dayNum, DEMO_TODAY, fmtDay, fmtWeekdayShort } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { MisTitle } from "../MisShell";
import { card, EmptyState, Loading, Stat, useToast } from "../ui";
import { NewStayModal, StayModal, StayStatusPill, type NewStayDraft } from "./StayModals";

const CELL = 40;

const BAR: Record<RoomDayState, string> = {
  free: "",
  booked: "bg-gold-soft text-[#6b4f1a] border border-gold/60",
  living: "bg-forest text-milk",
  cleaning: "bg-[#dce8ee] text-[#2f5a6b] border border-[#9cb8c6]",
  repair: "hatch bg-sand text-ink/60 border border-linen",
};

const LEGEND: RoomDayState[] = ["free", "booked", "living", "cleaning", "repair"];

interface Segment {
  start: number;
  len: number;
  state: RoomDayState;
  stay?: Stay;
}

/** Сливаем соседние дни одной брони в полосу */
function segments(row: GridRow): Segment[] {
  const out: Segment[] = [];
  row.cells.forEach((c, i) => {
    if (c.state === "free") return;
    const last = out[out.length - 1];
    const same = last && last.start + last.len === i && last.state === c.state && last.stay?.id === c.stay?.id;
    if (same) last.len++;
    else out.push({ start: i, len: 1, state: c.state, stay: c.stay });
  });
  return out;
}

/** Размещение: заезды и выезды сегодня + шахматка номеров по корпусам */
export function Stays() {
  const { sanatoriumId, tenant } = useSession();
  const san = (sanatoriumId === "all" ? tenant.primary : sanatoriumId) as SanatoriumId;
  const sanatorium = tenant.sanatoriums.find((s) => s.id === san)!;
  const [days, setDays] = useState<"14" | "30">("14");
  const [building, setBuilding] = useState<string>("all");
  const [open, setOpen] = useState<Stay | null>(null);
  const [draft, setDraft] = useState<NewStayDraft | null>(null);
  const toast = useToast();

  const { data: grid } = useService(() => staysService.grid(san, DEMO_TODAY, Number(days)), [san, days]);
  const { data: moves } = useService(() => staysService.movements(san), [san]);
  const rows = useMemo(() => grid?.rows.filter((r) => building === "all" || r.room.building === building) ?? [], [grid, building]);
  const today = grid?.rows.map((r) => r.cells[0]);

  if (sanatorium.kind === "spa") {
    return (
      <>
        <MisTitle title="Размещение" lead="Заезды и выезды сегодня и шахматка номеров." />
        <EmptyState icon={BedDouble} title="В СПА-клубе нет номеров" text="Гости приходят на процедуры по записи. Выберите санаторий в шапке, чтобы открыть шахматку." />
      </>
    );
  }

  return (
    <>
      <MisTitle
        title="Размещение"
        lead={`${sanatorium.title}: заезды и выезды сегодня и шахматка номеров. Нажмите на бронь, чтобы заселить или выселить гостя, или на свободную клетку — чтобы создать бронь.`}
        right={<Button onClick={() => setDraft({})}><CalendarPlus size={17} /> Новая бронь</Button>}
      />

      {sanatoriumId === "all" && <p className="-mt-4 mb-5 text-[14px] text-muted">Выбрана вся сеть — показываем {sanatorium.title}. Другой объект выберите в шапке.</p>}

      {today && (
        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <Stat label="Заезды сегодня" value={moves?.arrivals.length ?? "—"} tone="gold" />
          <Stat label="Выезды сегодня" value={moves?.departures.length ?? "—"} />
          <Stat label="Проживают" value={today.filter((c) => c.state === "living").length} tone="ok" />
          <Stat label="Свободно" value={today.filter((c) => c.state === "free").length} />
          <Stat label="Загрузка сегодня" value={`${Math.round((today.filter((c) => c.state === "living" || c.state === "booked").length / Math.max(1, today.filter((c) => c.state !== "repair").length)) * 100)}%`} />
        </div>
      )}

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <MovesList title="Заезды сегодня" icon={LogIn} empty="Сегодня заездов нет" list={moves?.arrivals} onOpen={setOpen} action="in" onDone={toast.show} />
        <MovesList title="Выезды сегодня" icon={LogOut} empty="Сегодня выездов нет" list={moves?.departures} onOpen={setOpen} action="out" onDone={toast.show} />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-[20px] font-semibold text-forest-deep">Шахматка номеров</h2>
        <div className="flex flex-wrap gap-2">
          {sanatorium.buildings.length > 1 && (
            <Segmented size="sm" value={building} onChange={setBuilding} options={[{ value: "all", label: "Все корпуса" }, ...sanatorium.buildings.map((b) => ({ value: b, label: b }))]} />
          )}
          <Segmented size="sm" value={days} onChange={setDays} options={[{ value: "14", label: "14 дней" }, { value: "30", label: "30 дней" }]} />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px] text-ink/80">
        {LEGEND.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <i className={`h-4 w-6 rounded ${s === "free" ? "border border-line bg-white" : BAR[s]}`} /> {ROOM_STATE_LABEL[s]}
          </span>
        ))}
      </div>

      {!grid ? (
        <Loading className="h-[480px]" />
      ) : (
        <div className={`${card} overflow-hidden`}>
          <div className="max-h-[70vh] overflow-auto">
            <div style={{ width: 150 + grid.dates.length * CELL }}>
              {/* даты */}
              <div className="sticky top-0 z-20 flex border-b border-line bg-milk">
                <div className="sticky left-0 z-10 w-[150px] shrink-0 bg-milk px-3 py-2 text-[12px] font-medium uppercase tracking-wider text-muted">Номер</div>
                {grid.dates.map((d) => <DateHead key={d} date={d} />)}
              </div>
              {rows.map((row) => (
                <div key={row.room.id} className="flex border-b border-line/60">
                  <div className="sticky left-0 z-10 w-[150px] shrink-0 border-r border-line bg-milk px-3 py-1.5">
                    <div className="text-[14px] font-semibold text-forest-deep">{row.room.number}</div>
                    <div className="truncate text-[11.5px] text-muted">{row.typeTitle}</div>
                  </div>
                  <div className="relative" style={{ width: grid.dates.length * CELL }}>
                    {/* пустые клетки — создать бронь */}
                    <div className="absolute inset-0 flex">
                      {grid.dates.map((d, i) => (
                        <button
                          key={d}
                          onClick={() => row.cells[i].state === "free" && setDraft({ hotelRoomId: row.room.id, from: d })}
                          aria-label={`Номер ${row.room.number}, ${fmtDay(d)}: ${ROOM_STATE_LABEL[row.cells[i].state].toLowerCase()}`}
                          className={`h-full shrink-0 border-r border-line/40 ${d === DEMO_TODAY ? "bg-gold-soft/30" : ""} ${row.cells[i].state === "free" ? "hover:bg-sage/40" : "cursor-default"}`}
                          style={{ width: CELL }}
                        />
                      ))}
                    </div>
                    {segments(row).map((s) => (
                      <button
                        key={`${s.start}-${s.stay?.id ?? s.state}`}
                        onClick={() => s.stay && s.state !== "cleaning" && setOpen(s.stay)}
                        title={s.stay ? `${s.stay.guestName} · ${fmtDay(s.stay.from)} — ${fmtDay(s.stay.to)}` : ROOM_STATE_LABEL[s.state]}
                        className={`absolute inset-y-1.5 truncate rounded-lg px-2 text-left text-[12px] leading-[26px] ${BAR[s.state]}`}
                        style={{ left: s.start * CELL + 2, width: s.len * CELL - 4 }}
                      >
                        {s.state === "repair" ? "Ремонт" : s.state === "cleaning" ? "Уборка" : s.stay?.guestName.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <StayModal stay={open} onClose={() => setOpen(null)} onDone={toast.show} />
      <NewStayModal draft={draft} onClose={() => setDraft(null)} onDone={toast.show} />
      {toast.node}
    </>
  );
}

function DateHead({ date }: { date: ISODate }) {
  const weekend = ["сб", "вс"].includes(fmtWeekdayShort(date));
  return (
    <div className={`shrink-0 py-1.5 text-center leading-tight ${date === DEMO_TODAY ? "bg-gold-soft/60" : ""}`} style={{ width: CELL }}>
      <div className={`text-[14px] font-semibold ${weekend ? "text-teal" : "text-forest-deep"}`}>{dayNum(date)}</div>
      <div className="text-[10.5px] uppercase text-muted">{date === DEMO_TODAY ? "сег" : fmtWeekdayShort(date)}</div>
    </div>
  );
}

function MovesList({
  title, icon: Icon, empty, list, onOpen, action, onDone,
}: {
  title: string;
  icon: typeof LogIn;
  empty: string;
  list?: Stay[];
  onOpen: (s: Stay) => void;
  action: "in" | "out";
  onDone: (t: string) => void;
}) {
  return (
    <div className={`${card} p-4 sm:p-5`}>
      <div className="mb-3 flex items-center gap-2 text-[16px] font-semibold text-forest-deep">
        <Icon size={18} className="text-teal" /> {title}
        {list && <span className="text-muted">· {list.length}</span>}
      </div>
      {!list ? (
        <Loading className="h-24" />
      ) : !list.length ? (
        <p className="text-[14px] text-muted">{empty}</p>
      ) : (
        <ul className="max-h-80 divide-y divide-line overflow-y-auto">
          {list.map((s) => {
            const room = staysService.roomById(s.hotelRoomId);
            const canAct = action === "in" ? s.status === "booked" : s.status === "checked_in";
            return (
              <li key={s.id} className="flex items-center gap-3 py-2.5">
                <button onClick={() => onOpen(s)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-[15px] font-medium text-forest-deep hover:underline">{s.guestName}</span>
                  <span className="flex items-center gap-1.5 text-[13px] text-muted">
                    <BedDouble size={13} /> № {room?.number} · {action === "in" ? `до ${fmtDay(s.to)}` : `с ${fmtDay(s.from)}`}
                  </span>
                </button>
                {canAct ? (
                  <Button
                    size="sm"
                    variant={action === "in" ? "primary" : "secondary"}
                    onClick={async () => {
                      if (action === "in") await staysService.checkIn(s.id);
                      else await staysService.checkOut(s.id);
                      onDone(action === "in" ? `Гость ${s.guestName} заселён в номер ${room?.number}` : `Гость ${s.guestName} выселен, номер ${room?.number} — на уборку`);
                    }}
                  >
                    {action === "in" ? "Заселить" : "Выселить"}
                  </Button>
                ) : (
                  <StayStatusPill stay={s} />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
