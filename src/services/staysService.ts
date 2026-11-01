/**
 * staysService — номерной фонд, брони и проживание: шахматка, заезды, выезды, загрузка.
 *
 * РЕАЛЬНЫЙ API:
 *   GET   /hotel/rooms?sanatoriumId              — номерной фонд
 *   GET   /stays?sanatoriumId&from&to            — брони и проживание
 *   POST  /stays                                  — новая бронь
 *   PATCH /stays/{id} { status }                  — заселение и выселение
 */
import type { HotelRoom, ISODate, PaymentStatus, RoomDayState, SanatoriumId, Stay, StayStatus } from "@/lib/types";
import { REVITAL } from "@/config/tenant";
import { hotelRooms, tables } from "@/mock/mis/store";
import { addDays, DEMO_TODAY, nightsBetween } from "@/lib/time";
import { stayPrice } from "@/lib/pricing";
import { catalogService } from "./catalogService";
import { auditService } from "./auditService";
import { latency, uid } from "./config";

export const STAY_STATUS_LABEL: Record<StayStatus, string> = {
  booked: "Бронь",
  checked_in: "Проживает",
  checked_out: "Выехал",
  cancelled: "Отменена",
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  paid: "Оплачено",
  partial: "Предоплата",
  unpaid: "Не оплачено",
};

export const ROOM_STATE_LABEL: Record<RoomDayState, string> = {
  free: "Свободен",
  booked: "Бронь",
  living: "Проживает",
  cleaning: "Уборка",
  repair: "Ремонт",
};

export interface GridCell {
  state: RoomDayState;
  stay?: Stay;
  /** День заезда или выезда — для скруглений полосы в шахматке */
  starts?: boolean;
}

export interface GridRow {
  room: HotelRoom;
  typeTitle: string;
  cells: GridCell[];
}

const active = (s: Stay) => s.status !== "cancelled";
const inSan = (id: SanatoriumId | "all") => (s: { sanatoriumId: SanatoriumId }) => id === "all" || s.sanatoriumId === id;

function cellFor(room: HotelRoom, date: ISODate, stays: Stay[]): GridCell {
  if (room.repair) return { state: "repair" };
  const stay = stays.find((s) => s.from <= date && date < s.to);
  if (stay) return { state: stay.status === "checked_in" ? "living" : "booked", stay, starts: stay.from === date };
  // Сегодня выезжает, но ещё не выселен — номер занят до выезда (до 12:00)
  const leaving = stays.find((s) => s.to === date && s.status === "checked_in");
  if (leaving && date === DEMO_TODAY) return { state: "living", stay: leaving };
  // В день выезда после выселения номер уходит на уборку
  const left = stays.find((s) => s.to === date && s.status === "checked_out");
  if (left && date === DEMO_TODAY) return { state: "cleaning", stay: left };
  return { state: "free" };
}

export interface NewStayInput {
  sanatoriumId: SanatoriumId;
  guestName: string;
  phone: string;
  hotelRoomId: string;
  from: ISODate;
  to: ISODate;
  guests: number;
  programId: string;
}

export const staysService = {
  /** Цена номера за ночь «от» — по данным сайта сети */
  roomPrice(room: HotelRoom) {
    return REVITAL.sanatoriums.find((s) => s.id === room.sanatoriumId)!.roomTypes.find((t) => t.id === room.typeId)?.priceRub ?? 0;
  },

  roomTypeTitle(room: HotelRoom) {
    const san = REVITAL.sanatoriums.find((s) => s.id === room.sanatoriumId)!;
    return san.roomTypes.find((t) => t.id === room.typeId)?.title ?? "Номер";
  },

  /** Номер брони — синхронно, для подписей в списках */
  roomById: (id: string): HotelRoom | undefined => hotelRooms().find((r) => r.id === id),

  async rooms(sanatoriumId: SanatoriumId): Promise<HotelRoom[]> {
    await latency();
    return hotelRooms().filter(inSan(sanatoriumId));
  },

  async list(sanatoriumId: SanatoriumId | "all", from?: ISODate, to?: ISODate): Promise<Stay[]> {
    await latency();
    return tables.stays
      .all()
      .filter(inSan(sanatoriumId))
      .filter((s) => (!from || s.to > from) && (!to || s.from < to))
      .sort((a, b) => a.from.localeCompare(b.from));
  },

  async get(id: string): Promise<Stay | undefined> {
    await latency();
    return tables.stays.find(id);
  },

  /** Шахматка: номера × дни, начиная с from */
  async grid(sanatoriumId: SanatoriumId, from: ISODate, days: number): Promise<{ dates: ISODate[]; rows: GridRow[] }> {
    await latency();
    const dates = Array.from({ length: days }, (_, i) => addDays(from, i));
    const end = addDays(from, days);
    const stays = tables.stays.all().filter((s) => s.sanatoriumId === sanatoriumId && active(s) && s.to >= from && s.from < end);
    const byRoom = new Map<string, Stay[]>();
    for (const s of stays) byRoom.set(s.hotelRoomId, [...(byRoom.get(s.hotelRoomId) ?? []), s]);
    const rows = hotelRooms()
      .filter((r) => r.sanatoriumId === sanatoriumId)
      .map((room) => ({
        room,
        typeTitle: this.roomTypeTitle(room),
        cells: dates.map((d) => cellFor(room, d, byRoom.get(room.id) ?? [])),
      }));
    return { dates, rows };
  },

  /** Заезды и выезды за день */
  async movements(sanatoriumId: SanatoriumId | "all", date: ISODate = DEMO_TODAY) {
    await latency();
    const stays = tables.stays.all().filter(inSan(sanatoriumId)).filter(active);
    return {
      arrivals: stays.filter((s) => s.from === date),
      departures: stays.filter((s) => s.to === date),
    };
  },

  /** Загрузка номерного фонда по дням, в процентах */
  async occupancy(sanatoriumId: SanatoriumId | "all", dates: ISODate[]): Promise<{ date: ISODate; percent: number; rooms: number; occupied: number }[]> {
    await latency();
    const rooms = hotelRooms().filter(inSan(sanatoriumId)).filter((r) => !r.repair).length;
    const stays = tables.stays.all().filter(inSan(sanatoriumId)).filter(active);
    return dates.map((date) => {
      const occupied = stays.filter((s) => s.from <= date && date < s.to).length;
      return { date, rooms, occupied, percent: rooms ? Math.round((occupied / rooms) * 100) : 0 };
    });
  },

  /** Свободные номера на даты — для новой брони */
  async freeRooms(sanatoriumId: SanatoriumId, from: ISODate, to: ISODate): Promise<HotelRoom[]> {
    await latency();
    const stays = tables.stays.all().filter((s) => s.sanatoriumId === sanatoriumId && active(s));
    return hotelRooms().filter(
      (r) => r.sanatoriumId === sanatoriumId && !r.repair && !stays.some((s) => s.hotelRoomId === r.id && from < s.to && s.from < to),
    );
  },

  async checkIn(id: string): Promise<Stay> {
    await latency(500);
    const stay = tables.stays.find(id)!;
    tables.stays.patch(id, { status: "checked_in" });
    auditService.log("edit", `Заселение гостя: ${stay.guestName}`, stay.patientId ?? undefined);
    return tables.stays.find(id)!;
  },

  async checkOut(id: string): Promise<Stay> {
    await latency(500);
    const stay = tables.stays.find(id)!;
    tables.stays.patch(id, { status: "checked_out" });
    auditService.log("edit", `Выселение гостя: ${stay.guestName}`, stay.patientId ?? undefined);
    return tables.stays.find(id)!;
  },

  async create(input: NewStayInput): Promise<Stay> {
    await latency(700);
    const nights = nightsBetween(input.from, input.to);
    const room = hotelRooms().find((r) => r.id === input.hotelRoomId)!;
    const roomPrice = REVITAL.sanatoriums.find((x) => x.id === room.sanatoriumId)!.roomTypes.find((t) => t.id === room.typeId)!.priceRub;
    const amountRub = stayPrice(roomPrice, catalogService.program(input.programId).pricePerNightRub, nights, input.guests);
    const stay: Stay = {
      id: uid("st"),
      sanatoriumId: input.sanatoriumId, patientId: null, guestName: input.guestName, hotelRoomId: input.hotelRoomId,
      from: input.from, to: input.to, guests: input.guests, programId: input.programId,
      status: "booked", payment: "unpaid", amountRub, paidRub: 0, source: "Отдел бронирования", createdAt: DEMO_TODAY,
    };
    tables.stays.insert(stay);
    auditService.log("edit", `Новая бронь: ${input.guestName}`);
    return stay;
  },

  async cancel(id: string): Promise<void> {
    await latency(400);
    tables.stays.patch(id, { status: "cancelled" });
  },
};
