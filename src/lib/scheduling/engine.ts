/**
 * Движок доступности слотов.
 *
 * Главное правило: слот доступен, только если ОДНОВРЕМЕННО
 *   1) врач работает в этот день и время входит в его смену;
 *   2) врач не занят другой записью (в ЛЮБОМ кабинете);
 *   3) найдётся кабинет, который
 *        — разрешён врачу,
 *        — оборудован для услуги,
 *        — доступен врачу по режиму (персональный / группа / общий),
 *        — свободен на всё время услуги.
 *
 * Свободный кабинет не означает свободного врача — и наоборот.
 *
 * Модуль чистый: не знает, откуда пришли данные (mock или МИС).
 * В рабочей версии на вход подаются справочники и записи,
 * синхронизированные из МИС «Санаториум».
 */
import type {
  Appointment, Doctor, DoctorStatus, ISODate, Minutes, Room, RoomCheck, Service, Slot, SlotCheck,
} from "@/lib/types";
import { fmtRange, fmtTime, overlaps, weekday } from "@/lib/time";

export interface ScheduleContext {
  doctors: Doctor[];
  rooms: Room[];
  services: Service[];
  /** Записи на рассматриваемую дату */
  appointments: Appointment[];
}

const active = (a: Appointment) => a.status !== "cancelled";

export function doctorDayStatus(doctor: Doctor, date: ISODate): DoctorStatus {
  const absence = doctor.absences.find((a) => date >= a.from && date <= a.to);
  if (absence) return absence.status;
  return doctor.workDays.includes(weekday(date)) ? "on_shift" : "off_shift";
}

export const DOCTOR_STATUS_LABEL: Record<DoctorStatus, string> = {
  on_shift: "На смене",
  off_shift: "Не на смене",
  vacation: "Отпуск",
  sick: "Больничный",
};

/** Правило основного кабинета: может ли врач в принципе работать в этом кабинете */
export function canUseRoom(room: Room, doctorId: string): { ok: boolean; reason: string } {
  if (room.access === "personal") {
    return room.ownerDoctorId === doctorId
      ? { ok: true, reason: "Персональный кабинет врача" }
      : { ok: false, reason: "Персональный кабинет другого врача" };
  }
  if (room.access === "group") {
    return room.allowedDoctorIds?.includes(doctorId)
      ? { ok: true, reason: "Врач входит в группу кабинета" }
      : { ok: false, reason: "Кабинет ограничен группой специалистов" };
  }
  return { ok: true, reason: "Общий кабинет" };
}

export function checkSlot(
  ctx: ScheduleContext,
  doctorId: string,
  serviceId: string,
  date: ISODate,
  start: Minutes,
): SlotCheck {
  const doctor = ctx.doctors.find((d) => d.id === doctorId)!;
  const service = ctx.services.find((s) => s.id === serviceId)!;
  const end = start + service.durationMin;
  const list = ctx.appointments.filter((a) => a.date === date && active(a));

  // 1. Смена
  const status = doctorDayStatus(doctor, date);
  let shift: SlotCheck["shift"];
  if (status !== "on_shift") {
    shift = { ok: false, reason: `Врач не работает в этот день — ${DOCTOR_STATUS_LABEL[status].toLowerCase()}` };
  } else if (start < doctor.shiftStart || end > doctor.shiftEnd) {
    shift = { ok: false, reason: `Вне рабочей смены (${fmtRange(doctor.shiftStart, doctor.shiftEnd)})` };
  } else {
    shift = { ok: true, reason: `Рабочая смена ${fmtRange(doctor.shiftStart, doctor.shiftEnd)}` };
  }

  // 2. Занятость врача — в любом кабинете
  const doctorBusy = list.find((a) => a.doctorId === doctorId && overlaps(start, end, a.start, a.end));
  const doctorCheck: SlotCheck["doctor"] = doctorBusy
    ? {
        ok: false,
        busyBy: doctorBusy,
        reason: doctorBusy.roomId
          ? `Врач занят ${fmtRange(doctorBusy.start, doctorBusy.end)} в кабинете №${doctorBusy.roomId}`
          : `Врач занят ${fmtRange(doctorBusy.start, doctorBusy.end)}: ${doctorBusy.note ?? "внутренняя занятость"}`,
      }
    : { ok: true, reason: `Врач свободен ${fmtRange(start, end)}` };

  // 3. Кабинеты — в порядке приоритета врача (основной — первым)
  const rooms: RoomCheck[] = doctor.roomIds.map((roomId) => {
    const room = ctx.rooms.find((r) => r.id === roomId)!;
    if (!service.roomIds.includes(roomId)) {
      return { roomId, state: "not_equipped", reason: "Не предназначен для этой услуги" };
    }
    const access = canUseRoom(room, doctorId);
    if (!access.ok) return { roomId, state: "not_allowed", reason: access.reason };
    const busy = list.find((a) => a.roomId === roomId && overlaps(start, end, a.start, a.end));
    if (busy) {
      return { roomId, state: "busy", busyBy: busy, reason: `Занят ${fmtRange(busy.start, busy.end)}` };
    }
    return { roomId, state: "free", reason: `Свободен ${fmtRange(start, end)}` };
  });

  const freeRoom = rooms.find((r) => r.state === "free");
  const available = shift.ok && doctorCheck.ok && !!freeRoom;

  let summary: string;
  if (!shift.ok) summary = shift.reason;
  else if (!doctorCheck.ok) {
    const room = doctorBusy?.roomId;
    const mainFree = doctor.mainRoomId && rooms.find((r) => r.roomId === doctor.mainRoomId)?.state === "free";
    summary =
      room && room !== doctor.mainRoomId && mainFree
        ? `Врач занят в это время в другом кабинете (№${room}). Основной кабинет №${doctor.mainRoomId} свободен, но записать нельзя.`
        : "Врач занят в это время";
  } else if (!freeRoom) summary = "Нет свободного подходящего кабинета — время не показывается пациенту";
  else summary = `${fmtTime(start)} доступно — система назначает кабинет №${freeRoom.roomId}`;

  return {
    doctorId, serviceId, date, start, end,
    shift, doctor: doctorCheck, rooms,
    assignedRoomId: available ? freeRoom!.roomId : null,
    available, summary,
  };
}

export function findSlots(
  ctx: ScheduleContext,
  doctorId: string,
  serviceId: string,
  date: ISODate,
  opts: { step?: number; from?: Minutes } = {},
): Slot[] {
  const step = opts.step ?? 30;
  const doctor = ctx.doctors.find((d) => d.id === doctorId)!;
  const service = ctx.services.find((s) => s.id === serviceId)!;
  if (doctorDayStatus(doctor, date) !== "on_shift") return [];
  const out: Slot[] = [];
  for (let t = Math.max(doctor.shiftStart, opts.from ?? 0); t + service.durationMin <= doctor.shiftEnd; t += step) {
    const c = checkSlot(ctx, doctorId, serviceId, date, t);
    if (c.available) out.push({ date, start: t, end: c.end, doctorId, roomId: c.assignedRoomId! });
  }
  return out;
}
