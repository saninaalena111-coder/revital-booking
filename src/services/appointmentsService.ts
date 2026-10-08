/**
 * appointmentsService — свободные слоты, создание, перенос и отмена записей.
 *
 * РЕАЛЬНЫЙ API (через integrationService):
 *   GET    /slots?doctorId&serviceId&date — свободные интервалы
 *          (либо расчёт на нашей стороне по синхронизированным данным — engine.ts)
 *   POST   /appointments                  — создать запись, получить ID записи МИС
 *   PATCH  /appointments/{id}             — перенос
 *   DELETE /appointments/{id}             — отмена
 */
import type { Appointment, Attribution, ISODate, Slot, SlotCheck } from "@/lib/types";
import { DOCTORS, ROOMS, SERVICES } from "@/mock/catalog";
import { db } from "@/mock/db";
import { ANNA_APPOINTMENT_ID, HANDCRAFTED } from "@/mock/appointments";
import { checkSlot, findSlots, type ScheduleContext } from "@/lib/scheduling/engine";
import { addDays } from "@/lib/time";
import { latency, uid } from "./config";
import { notificationsService } from "./notificationsService";

const ctxFor = (date: ISODate, appointments?: Appointment[]): ScheduleContext => ({
  doctors: DOCTORS, rooms: ROOMS, services: SERVICES, appointments: appointments ?? db.byDate(date),
});

export interface CreateAppointmentInput {
  patientId: string | null;
  patientName: string;
  phone: string;
  slot: Slot;
  serviceId: string;
  attribution: Attribution;
}

export const appointmentsService = {
  async byDate(date: ISODate): Promise<Appointment[]> {
    await latency();
    return db.byDate(date);
  },

  /**
   * ДЕМО: эталонный день 12 октября для примеров на экране «Логика расписания».
   * Не зависит от записей, созданных пользователем в прототипе.
   */
  async referenceDay(): Promise<{ date: ISODate; appointments: Appointment[]; exampleId: string }> {
    await latency();
    const date = HANDCRAFTED.find((a) => a.id === ANNA_APPOINTMENT_ID)!.date;
    return { date, appointments: HANDCRAFTED.filter((a) => a.date === date), exampleId: ANNA_APPOINTMENT_ID };
  },

  async slots(doctorId: string, serviceId: string, date: ISODate): Promise<Slot[]> {
    await latency();
    return findSlots(ctxFor(date), doctorId, serviceId, date);
  },

  /** Количество свободных слотов по дням — для подсветки календаря */
  async availabilityByDay(doctorIds: string[], serviceId: string, dates: ISODate[]) {
    await latency();
    return Object.fromEntries(
      dates.map((d) => [d, doctorIds.reduce((n, id) => n + findSlots(ctxFor(d), id, serviceId, d).length, 0)]),
    ) as Record<ISODate, number>;
  },

  /** Ближайший свободный слот врача начиная с даты */
  async nearest(doctorId: string, serviceId: string, from: ISODate, days = 14): Promise<Slot | null> {
    await latency();
    for (let i = 0; i < days; i++) {
      const d = addDays(from, i);
      const s = findSlots(ctxFor(d), doctorId, serviceId, d);
      if (s.length) return s[0];
    }
    return null;
  },

  /** Объяснение решения по конкретному времени (для презентации и админки) */
  async explain(doctorId: string, serviceId: string, date: ISODate, start: number, appointments?: Appointment[]): Promise<SlotCheck> {
    await latency();
    return checkSlot(ctxFor(date, appointments), doctorId, serviceId, date, start);
  },

  async forPatient(patientId: string): Promise<Appointment[]> {
    await latency();
    return db.touchable()
      .filter((a) => a.patientId === patientId)
      .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  },

  async get(id: string) {
    await latency();
    return db.find(id);
  },

  async create(input: CreateAppointmentInput): Promise<Appointment> {
    await latency(700);
    // Повторная проверка перед созданием: слот мог занять другой пациент
    const check = checkSlot(ctxFor(input.slot.date), input.slot.doctorId, input.serviceId, input.slot.date, input.slot.start);
    if (!check.available) throw new Error("Это время только что заняли. Пожалуйста, выберите другое.");
    const id = uid("a");
    const appt: Appointment = {
      id,
      misId: `SAN-APP-${id.slice(2).toUpperCase()}`, // в рабочей версии — ID из ответа МИС
      patientId: input.patientId,
      patientName: input.patientName,
      doctorId: input.slot.doctorId,
      serviceId: input.serviceId,
      roomId: check.assignedRoomId,
      date: input.slot.date,
      start: input.slot.start,
      end: check.end,
      status: "confirmed",
      kind: "visit",
      attribution: input.attribution,
      createdVia: "online",
      createdAt: new Date().toISOString(),
    };
    db.insert(appt);
    notificationsService.onCreated(appt);
    return appt;
  },

  async reschedule(id: string, slot: Slot): Promise<Appointment> {
    await latency(600);
    const current = db.find(id)!;
    const others = db.byDate(slot.date).filter((a) => a.id !== id);
    const check = checkSlot(ctxFor(slot.date, others), slot.doctorId, current.serviceId!, slot.date, slot.start);
    if (!check.available) throw new Error("Это время уже недоступно.");
    db.patch(id, { date: slot.date, start: slot.start, end: check.end, roomId: check.assignedRoomId, doctorId: slot.doctorId });
    const updated = db.find(id)!;
    notificationsService.onChanged(updated);
    return updated;
  },

  async cancel(id: string): Promise<void> {
    await latency(500);
    db.patch(id, { status: "cancelled" });
    notificationsService.onCancelled(db.find(id)!);
  },
};
