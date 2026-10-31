/**
 * mealsService — питание: диетстолы гостей, заказы блюд на завтра, сводка для кухни.
 *
 * В Геленджике гости корпуса 4 питаются в ресторане «А-ля карт» и заказывают блюда
 * на следующий день по своему диетстолу. Гости корпуса 2 — в зале «Шведский стол»:
 * кухне нужно знать, сколько гостей на каком диетстоле.
 *
 * РЕАЛЬНЫЙ API: GET /meals/orders?date   PUT /meals/orders/{patientId}/{date}   GET /meals/kitchen?date
 */
import type { DietTable, Dish, ISODate, MealOrder, Patient, SanatoriumId } from "@/lib/types";
import { hotelRooms, tables } from "@/mock/mis/store";
import { addDays, DEMO_TODAY } from "@/lib/time";
import { catalogService } from "./catalogService";
import { auditService } from "./auditService";
import { latency } from "./config";

export type RestaurantId = "alacarte" | "buffet";

export const RESTAURANT_LABEL: Record<RestaurantId, string> = {
  alacarte: "А-ля карт",
  buffet: "Шведский стол",
};

export interface MealGuest {
  patient: Patient;
  table: DietTable;
  restaurant: RestaurantId;
  roomNumber: string;
  order?: MealOrder;
}

export const TOMORROW = addDays(DEMO_TODAY, 1);

/** В каком зале питается гость: по корпусу номера */
function restaurantOf(patient: Patient): RestaurantId | null {
  if (!patient.stayId) return null;
  const stay = tables.stays.find(patient.stayId);
  const room = stay && hotelRooms().find((r) => r.id === stay.hotelRoomId);
  if (!room) return null;
  return room.building === "Корпус 4" ? "alacarte" : "buffet";
}

export const mealsService = {
  restaurantOf,

  /** Гости, которые проживают в санатории в эту дату, с диетстолом и заказом */
  async guests(date: ISODate = TOMORROW, sanatoriumId: SanatoriumId = "gelendzhik"): Promise<MealGuest[]> {
    await latency();
    const orders = tables.mealOrders.all().filter((o) => o.date === date);
    return tables.patients
      .all()
      .filter((p) => p.sanatoriumId === sanatoriumId && p.stayId)
      .flatMap((patient) => {
        const stay = tables.stays.find(patient.stayId!)!;
        if (stay.status === "cancelled" || !(stay.from <= date && date < stay.to)) return [];
        const restaurant = restaurantOf(patient);
        if (!restaurant) return [];
        return [{
          patient,
          table: catalogService.dietTable(patient.dietTableId ?? "t15"),
          restaurant,
          roomNumber: hotelRooms().find((r) => r.id === stay.hotelRoomId)!.number,
          order: orders.find((o) => o.patientId === patient.id),
        }];
      })
      .sort((a, b) => a.patient.lastName.localeCompare(b.patient.lastName, "ru"));
  },

  /** Блюда, подходящие диетстолу гостя */
  menuFor(tableId: string): Dish[] {
    return catalogService.dishes().filter((d) => d.tableIds.includes(tableId));
  },

  async orderFor(patientId: string, date: ISODate = TOMORROW): Promise<MealOrder | undefined> {
    await latency();
    return tables.mealOrders.all().find((o) => o.patientId === patientId && o.date === date);
  },

  async setOrder(patientId: string, date: ISODate, dishIds: string[], byGuest = false): Promise<void> {
    await latency(300);
    const id = `meal-${patientId}-${date}`;
    if (tables.mealOrders.find(id)) tables.mealOrders.patch(id, { dishIds });
    else tables.mealOrders.insert({ id, patientId, date, dishIds });
    if (!byGuest) auditService.log("edit", "Изменён заказ питания", patientId);
  },

  /** Сводка для кухни: порции блюд «А-ля карт» и гости «Шведского стола» по диетстолам */
  async kitchen(date: ISODate = TOMORROW) {
    const guests = await this.guests(date);
    const alacarte = guests.filter((g) => g.restaurant === "alacarte");
    const portions = new Map<string, number>();
    for (const g of alacarte) for (const id of g.order?.dishIds ?? []) portions.set(id, (portions.get(id) ?? 0) + 1);
    const byTable = (list: MealGuest[]) =>
      catalogService.dietTables().map((t) => ({ table: t, count: list.filter((g) => g.table.id === t.id).length })).filter((x) => x.count);
    return {
      alacarte: {
        guests: alacarte.length,
        ordered: alacarte.filter((g) => g.order).length,
        dishes: [...portions].map(([id, count]) => ({ dish: catalogService.dish(id), count })).sort((a, b) => b.count - a.count),
        byTable: byTable(alacarte),
      },
      buffet: { guests: guests.filter((g) => g.restaurant === "buffet").length, byTable: byTable(guests.filter((g) => g.restaurant === "buffet")) },
    };
  },
};
