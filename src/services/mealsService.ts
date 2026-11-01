/**
 * mealsService — питание: диетстолы гостей, заказы блюд на завтра, сводка для кухни.
 *
 * Кухня готовит на всех проживающих: гостям с медкартой диетстол назначает врач,
 * остальным — общий стол №15. В ресторанах с предзаказом («А-ля карт» в Геленджике 4★,
 * ресторан Геленджика 5★) гости выбирают блюда на завтра, в остальных залах кухня готовит
 * по числу гостей на каждом диетстоле.
 *
 * РЕАЛЬНЫЙ API: GET /meals/orders?date   PUT /meals/orders/{patientId}/{date}   GET /meals/kitchen?date
 */
import type { DietTable, Dish, HotelRoom, ISODate, MealOrder, Patient, SanatoriumId } from "@/lib/types";
import { REVITAL, type Restaurant } from "@/config/tenant";
import { hotelRooms, tables } from "@/mock/mis/store";
import { addDays, DEMO_TODAY } from "@/lib/time";
import { catalogService } from "./catalogService";
import { auditService } from "./auditService";
import { latency } from "./config";

export interface MealGuest {
  /** Бронь проживания — одна строка на номер */
  id: string;
  name: string;
  /** Гость с медкартой: у него диетстол от врача и заказ блюд */
  patient?: Patient;
  persons: number;
  table: DietTable;
  restaurant: Restaurant;
  roomNumber: string;
  order?: MealOrder;
}

export const TOMORROW = addDays(DEMO_TODAY, 1);

/** В каком зале питается гость: в Геленджике 4★ — по корпусу, в остальных — основной ресторан */
function restaurantOfRoom(room: HotelRoom): Restaurant | null {
  const san = REVITAL.sanatoriums.find((s) => s.id === room.sanatoriumId);
  if (!san?.restaurants.length) return null;
  if (san.id === "gelendzhik") return san.restaurants.find((r) => r.id === (room.building === "Корпус 4" ? "alacarte" : "buffet"))!;
  return san.restaurants[0];
}

function restaurantOf(patient: Patient): Restaurant | null {
  const stay = patient.stayId ? tables.stays.find(patient.stayId) : undefined;
  const room = stay && hotelRooms().find((r) => r.id === stay.hotelRoomId);
  return room ? restaurantOfRoom(room) : null;
}

export const mealsService = {
  restaurantOf,

  /** Все проживающие в санатории в эту дату: диетстол, зал и заказ (у гостей с медкартой) */
  async guests(date: ISODate = TOMORROW, sanatoriumId: SanatoriumId = "gelendzhik"): Promise<MealGuest[]> {
    await latency();
    const orders = tables.mealOrders.all().filter((o) => o.date === date);
    return tables.stays
      .all()
      .filter((s) => s.sanatoriumId === sanatoriumId && s.status !== "cancelled" && s.from <= date && date < s.to)
      .flatMap((stay) => {
        const room = hotelRooms().find((r) => r.id === stay.hotelRoomId)!;
        const restaurant = restaurantOfRoom(room);
        if (!restaurant) return [];
        const patient = stay.patientId ? tables.patients.find(stay.patientId) : undefined;
        return [{
          id: stay.id,
          name: stay.guestName,
          patient,
          persons: stay.guests,
          table: catalogService.dietTable(patient?.dietTableId ?? "t15"),
          restaurant,
          roomNumber: room.number,
          order: patient ? orders.find((o) => o.patientId === patient.id) : undefined,
        }];
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
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

  /** Сводка для кухни по каждому залу санатория: гости по диетстолам и порции предзаказа */
  async kitchen(date: ISODate = TOMORROW, sanatoriumId: SanatoriumId = "gelendzhik") {
    const guests = await this.guests(date, sanatoriumId);
    const san = REVITAL.sanatoriums.find((s) => s.id === sanatoriumId)!;
    return san.restaurants.map((restaurant) => {
      const list = guests.filter((g) => g.restaurant.id === restaurant.id);
      const portions = new Map<string, number>();
      for (const g of list) for (const id of g.order?.dishIds ?? []) portions.set(id, (portions.get(id) ?? 0) + 1);
      const withCard = list.filter((g) => g.patient);
      return {
        restaurant,
        persons: list.reduce((s, g) => s + g.persons, 0),
        byTable: catalogService
          .dietTables()
          .map((t) => ({ table: t, count: list.filter((g) => g.table.id === t.id).reduce((s, g) => s + g.persons, 0) }))
          .filter((x) => x.count),
        /** Предзаказ делают гости с медкартой — остальные выбирают блюда в ресторане */
        orderGuests: withCard.length,
        ordered: withCard.filter((g) => g.order).length,
        dishes: [...portions].map(([id, count]) => ({ dish: catalogService.dish(id), count })).sort((a, b) => b.count - a.count),
      };
    });
  },
};
