/**
 * roomsService — кабинеты, режим доступа, привязка врачей, занятость.
 *
 * РЕАЛЬНЫЙ API: GET /rooms, GET /rooms/{id}/schedule?date=…
 * Режим доступа (персональный / группа / общий) может храниться
 * в нашей системе, если в МИС такого признака нет.
 */
import type { Appointment, ISODate, Room } from "@/lib/types";
import { ROOMS, DOCTORS } from "@/mock/catalog";
import { db } from "@/mock/db";
import { latency } from "./config";

export const roomsService = {
  async list(): Promise<Room[]> {
    await latency();
    return ROOMS;
  },
  async get(id: string): Promise<Room | undefined> {
    await latency();
    return ROOMS.find((r) => r.id === id);
  },
  /** Какие врачи могут работать в кабинете */
  async doctorsFor(roomId: string) {
    await latency();
    return DOCTORS.filter((d) => d.roomIds.includes(roomId));
  },
  async schedule(roomId: string, date: ISODate): Promise<Appointment[]> {
    await latency();
    return db.byDate(date).filter((a) => a.roomId === roomId && a.status !== "cancelled");
  },
};
