"use client";

import Link from "next/link";
import { BedDouble, CalendarPlus, CreditCard, Globe2, Loader2, LogIn, LogOut, Minus, Plus, UserRound, XCircle } from "lucide-react";
import { useState } from "react";
import type { ISODate, PaymentStatus, SanatoriumId, Stay } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { catalogService, PAYMENT_LABEL, staysService, STAY_STATUS_LABEL } from "@/services";
import { addDays, DEMO_TODAY, fmtDay, nightsBetween } from "@/lib/time";
import { plural } from "@/lib/scheduling/planner";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ComingSoonButton } from "../ComingSoon";
import { StatusPill } from "../ui";

export const rub = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

const PAY_TONE: Record<PaymentStatus, "ok" | "gold" | "danger"> = { paid: "ok", partial: "gold", unpaid: "danger" };

export function PaymentPill({ status }: { status: PaymentStatus }) {
  return <StatusPill tone={PAY_TONE[status]} icon={CreditCard}>{PAYMENT_LABEL[status]}</StatusPill>;
}

export function StayStatusPill({ stay }: { stay: Stay }) {
  if (stay.status === "booked" && stay.from === DEMO_TODAY) return <StatusPill tone="gold" icon={LogIn}>Заезд сегодня</StatusPill>;
  if (stay.status === "checked_in" && stay.to === DEMO_TODAY) return <StatusPill tone="info" icon={LogOut}>Выезд сегодня</StatusPill>;
  const tone = { booked: "wait", checked_in: "ok", checked_out: "muted", cancelled: "danger" } as const;
  return <StatusPill tone={tone[stay.status]}>{STAY_STATUS_LABEL[stay.status]}</StatusPill>;
}

/** Карточка брони: гость, программа, номер, даты, оплата и действия ресепшн */
export function StayModal({ stay, onClose, onDone }: { stay: Stay | null; onClose: () => void; onDone: (t: string) => void }) {
  const [busy, setBusy] = useState(false);
  const room = stay ? staysService.roomById(stay.hotelRoomId) : undefined;

  const act = async (fn: () => Promise<unknown>, text: string) => {
    setBusy(true);
    await fn();
    setBusy(false);
    onDone(text);
    onClose();
  };

  return (
    <Modal open={!!stay} onClose={onClose} title={stay?.guestName}>
      {stay && room && (
        <>
          <div className="-mt-2 flex flex-wrap gap-1.5">
            <StayStatusPill stay={stay} />
            <PaymentPill status={stay.payment} />
          </div>
          <dl className="mt-5 grid gap-x-6 gap-y-3 text-[14.5px] sm:grid-cols-2">
            <Item label="Номер" value={`№ ${room.number} · ${staysService.roomTypeTitle(room)}`} />
            <Item label="Корпус" value={room.building} />
            <Item label="Даты" value={`${fmtDay(stay.from)} — ${fmtDay(stay.to)}`} />
            <Item label="Ночей" value={`${nightsBetween(stay.from, stay.to)} · ${stay.guests} ${plural(stay.guests, "гость", "гостя", "гостей")}`} />
            <Item label="Программа" value={catalogService.program(stay.programId).title} />
            <Item label="Источник брони" value={stay.source} />
            <Item label="Стоимость" value={rub(stay.amountRub)} />
            <Item label="Оплачено" value={`${rub(stay.paidRub)}${stay.paidRub < stay.amountRub ? ` · к оплате ${rub(stay.amountRub - stay.paidRub)}` : ""}`} />
          </dl>
          <p className="mt-3 text-[12.5px] text-muted">Заезд с 14:00, выезд до 12:00. Цены демонстрационные.</p>

          <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
            {stay.status === "booked" && stay.from <= DEMO_TODAY && (
              <Button disabled={busy} onClick={() => act(() => staysService.checkIn(stay.id), `Гость ${stay.guestName} заселён в номер ${room.number}`)}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Заселить
              </Button>
            )}
            {stay.status === "checked_in" && (
              <Button disabled={busy} onClick={() => act(() => staysService.checkOut(stay.id), `Гость ${stay.guestName} выселен, номер ${room.number} — на уборку`)}>
                {busy ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />} Выселить
              </Button>
            )}
            {stay.paidRub < stay.amountRub && stay.status !== "cancelled" && (
              <ComingSoonButton feature="cashdesk"><CreditCard size={16} /> Принять оплату</ComingSoonButton>
            )}
            <ComingSoonButton feature="migration" variant="ghost"><Globe2 size={16} /> Иностранный гость</ComingSoonButton>
            {stay.patientId && (
              <Link href={`/mis/patient?id=${stay.patientId}`} className="inline-flex h-11 items-center gap-2 rounded-full px-4 text-[15px] font-medium text-forest hover:bg-forest/[0.06]">
                <UserRound size={16} /> Карта гостя
              </Link>
            )}
            {stay.status === "booked" && stay.from > DEMO_TODAY && (
              <Button variant="ghost" disabled={busy} className="!text-danger hover:!bg-danger-soft" onClick={() => act(() => staysService.cancel(stay.id), "Бронь отменена, номер освобождён")}>
                <XCircle size={16} /> Отменить бронь
              </Button>
            )}
          </div>
        </>
      )}
    </Modal>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12.5px] text-muted">{label}</dt>
      <dd className="font-medium text-forest-deep">{value}</dd>
    </div>
  );
}

export interface NewStayDraft {
  hotelRoomId?: string;
  from?: ISODate;
}

/** Новая бронь: гость, программа, даты → свободные номера → «Создать бронь» */
export function NewStayModal({ draft, onClose, onDone }: { draft: NewStayDraft | null; onClose: () => void; onDone: (t: string) => void }) {
  return (
    <Modal open={!!draft} onClose={onClose} title="Новая бронь" wide>
      {draft && <NewStayForm key={`${draft.hotelRoomId}-${draft.from}`} draft={draft} onClose={onClose} onDone={onDone} />}
    </Modal>
  );
}

function NewStayForm({ draft, onClose, onDone }: { draft: NewStayDraft; onClose: () => void; onDone: (t: string) => void }) {
  const { sanatoriumId, tenant } = useSession();
  const san = (sanatoriumId === "all" ? tenant.primary : sanatoriumId) as SanatoriumId;
  const sanatorium = tenant.sanatoriums.find((s) => s.id === san)!;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [programId, setProgramId] = useState("base");
  const [from, setFrom] = useState<ISODate>(draft.from ?? addDays(DEMO_TODAY, 3));
  const [nights, setNights] = useState(Math.max(7, catalogService.program("base").minNights));
  const [guests, setGuests] = useState(1);
  const [typeId, setTypeId] = useState<string>("any");
  const [roomId, setRoomId] = useState<string | undefined>(draft.hotelRoomId);
  const [busy, setBusy] = useState(false);
  const to = addDays(from, nights);
  const { data: free } = useService(() => staysService.freeRooms(san, from, to), [san, from, to]);
  const rooms = free?.filter((r) => typeId === "any" || r.typeId === typeId) ?? [];
  const picked = free?.find((r) => r.id === roomId);
  const program = catalogService.program(programId);
  const total = program.pricePerNightRub * nights * guests;
  const ready = name.trim().length > 2 && phone.replace(/\D/g, "").length >= 10 && picked;

  const save = async () => {
    if (!picked) return;
    setBusy(true);
    await staysService.create({ sanatoriumId: san, guestName: name.trim(), phone, hotelRoomId: picked.id, from, to, guests, programId });
    setBusy(false);
    onDone(`Бронь создана: ${name.trim()}, номер ${picked.number}, ${fmtDay(from)} — ${fmtDay(to)}`);
    onClose();
  };

  const input = "mt-1.5 h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] outline-none focus:border-forest/50";

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[14px] font-medium text-forest-deep">Гость</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Фамилия Имя Отчество" className={input} />
        </label>
        <label className="block">
          <span className="text-[14px] font-medium text-forest-deep">Телефон</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 (900) 000-00-00" inputMode="tel" className={input} />
        </label>
        <label className="block">
          <span className="text-[14px] font-medium text-forest-deep">Программа</span>
          <select value={programId} onChange={(e) => { setProgramId(e.target.value); setNights((n) => Math.max(n, catalogService.program(e.target.value).minNights)); }} className={input}>
            {catalogService.programs().map((p) => <option key={p.id} value={p.id}>{p.title} — от {p.minNights} ночей</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[14px] font-medium text-forest-deep">Дата заезда</span>
          <input type="date" value={from} min={DEMO_TODAY} onChange={(e) => e.target.value && setFrom(e.target.value)} className={input} />
        </label>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <Stepper label="Ночей" value={nights} min={program.minNights} max={28} onChange={setNights} hint={`выезд ${fmtDay(to)}`} />
        <Stepper label="Гостей" value={guests} min={1} max={4} onChange={setGuests} />
        <label className="block min-w-48 flex-1">
          <span className="text-[14px] font-medium text-forest-deep">Категория номера</span>
          <select value={typeId} onChange={(e) => setTypeId(e.target.value)} className={input}>
            <option value="any">Любая</option>
            {sanatorium.roomTypes.map((t) => <option key={t.id} value={t.id}>{t.title}{t.building ? ` (${t.building.toLowerCase()})` : ""}</option>)}
          </select>
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-baseline justify-between text-[14px]">
          <span className="font-medium text-forest-deep">Свободные номера на эти даты</span>
          <span className="text-muted">{free ? `${rooms.length} ${plural(rooms.length, "номер", "номера", "номеров")}` : "ищем…"}</span>
        </div>
        <div className="scrollbar-none flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
          {rooms.slice(0, 40).map((r) => (
            <button key={r.id} onClick={() => setRoomId(r.id)} className={`flex min-h-10 items-center gap-1.5 rounded-xl border px-3 text-[13.5px] ${r.id === roomId ? "border-forest bg-forest text-milk" : "border-line bg-white hover:border-forest/40"}`}>
              <BedDouble size={14} /> {r.number}
            </button>
          ))}
          {free && !rooms.length && <p className="text-[14px] text-muted">На эти даты свободных номеров этой категории нет — выберите другие даты или категорию.</p>}
        </div>
        {roomId && !picked && free && <p className="mt-2 text-[13.5px] text-danger">Выбранный номер занят на эти даты — выберите другой.</p>}
      </div>

      <div className="flex flex-col gap-4 rounded-2xl bg-cream/70 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-[14.5px]">
          {picked ? <>Номер <b>{picked.number}</b> · {staysService.roomTypeTitle(picked)} · </> : "Выберите номер · "}
          {fmtDay(from)} — {fmtDay(to)}
          <div className="font-display mt-1 text-[26px] text-forest-deep">{rub(total)}</div>
          <div className="text-[12.5px] text-muted">{rub(program.pricePerNightRub)} за ночь × {nights} × {guests} (демо-цены)</div>
        </div>
        <Button size="lg" onClick={save} disabled={!ready || busy}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : <CalendarPlus size={18} />} Создать бронь
        </Button>
      </div>
    </div>
  );
}

function Stepper({ label, value, min, max, onChange, hint }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; hint?: string }) {
  return (
    <div>
      <div className="text-[14px] font-medium text-forest-deep">{label}</div>
      <div className="mt-1.5 flex items-center gap-1 rounded-full border border-line bg-white p-1">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream" aria-label={`${label}: меньше`}><Minus size={16} /></button>
        <span className="w-8 text-center text-[17px] font-semibold tabular-nums">{value}</span>
        <button onClick={() => onChange(Math.min(max, value + 1))} className="grid h-10 w-10 place-items-center rounded-full hover:bg-cream" aria-label={`${label}: больше`}><Plus size={16} /></button>
      </div>
      {hint && <div className="mt-1 text-[12.5px] text-muted">{hint}</div>}
    </div>
  );
}
