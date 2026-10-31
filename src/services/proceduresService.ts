/**
 * proceduresService и prescriptionsService — назначения врача и расписание процедур.
 *
 * Врач назначает курс → planner.ts раскладывает сеансы по дням проживания →
 * сеансы видны медсестре в очереди кабинета и гостю в личном кабинете.
 * Отметка медсестры «выполнено» сразу меняет счётчик курса у гостя.
 *
 * РЕАЛЬНЫЙ API:
 *   GET   /prescriptions?patientId          POST /prescriptions        DELETE /prescriptions/{id}
 *   GET   /sessions?date&roomId             PATCH /sessions/{id} { status, date, start }
 */
import type {
  Frequency, ISODate, MedRoom, Patient, Prescription, Procedure, ProcedureSession, SanatoriumId, SessionStatus,
} from "@/lib/types";
import { db } from "@/mock/db";
import { tables } from "@/mock/mis/store";
import { session } from "@/mock/session";
import { planCourse, type Interval, type PlanResult } from "@/lib/scheduling/planner";
import { addDays, daysBetween, DEMO_NOW, DEMO_TODAY, fmtDay, fmtTime } from "@/lib/time";
import { catalogService } from "./catalogService";
import { auditService } from "./auditService";
import { latency, uid } from "./config";

export const SESSION_STATUS_LABEL: Record<SessionStatus, string> = {
  planned: "Запланирована",
  done: "Выполнена",
  missed: "Гость не пришёл",
  cancelled: "Отменена",
};

export interface SessionRow {
  session: ProcedureSession;
  procedure: Procedure;
  room: MedRoom;
  patient: Patient;
  /** Номер сеанса в курсе: «3 из 10» */
  index: number;
  total: number;
}

export interface CourseProgress {
  prescription: Prescription;
  procedure: Procedure;
  total: number;
  done: number;
  missed: number;
  planned: number;
  next?: ProcedureSession;
}

function rowsFor(sessions: ProcedureSession[]): SessionRow[] {
  const all = tables.sessions.all();
  return sessions.map((s) => {
    const course = all.filter((x) => x.prescriptionId === s.prescriptionId && x.status !== "cancelled").sort(bySchedule);
    return {
      session: s,
      procedure: catalogService.procedure(s.procedureId),
      room: catalogService.medRoom(s.roomId),
      patient: tables.patients.find(s.patientId)!,
      index: course.findIndex((x) => x.id === s.id) + 1,
      total: course.length,
    };
  });
}

const bySchedule = (a: ProcedureSession, b: ProcedureSession) => a.date.localeCompare(b.date) || a.start - b.start;

/** Приёмы врачей у гостя — чтобы процедура не попала на время консультации */
function guestAppointments(patientId: string, from: ISODate, to: ISODate): Interval[] {
  return daysBetween(from, to).flatMap((d) =>
    db.byDate(d).filter((a) => a.patientId === patientId && a.status !== "cancelled").map((a) => ({ date: a.date, start: a.start, end: a.end })),
  );
}

function stayOf(patient: Patient) {
  return patient.stayId ? tables.stays.find(patient.stayId) : undefined;
}

export const proceduresService = {
  /** Очередь процедур на день: по кабинетам (или всем кабинетам санатория) */
  async queue(date: ISODate, roomIds?: string[]): Promise<SessionRow[]> {
    await latency();
    const list = tables.sessions
      .all()
      .filter((s) => s.date === date && s.status !== "cancelled" && (!roomIds?.length || roomIds.includes(s.roomId)))
      .sort(bySchedule);
    return rowsFor(list);
  },

  /** Все сеансы гостя по дням — «Моё расписание» */
  async forPatient(patientId: string): Promise<SessionRow[]> {
    await latency();
    return rowsFor(tables.sessions.all().filter((s) => s.patientId === patientId && s.status !== "cancelled").sort(bySchedule));
  },

  /** Загрузка кабинетов на день — для таймлайна */
  async roomsLoad(date: ISODate, sanatoriumId: SanatoriumId = "gelendzhik") {
    await latency();
    const rooms = catalogService.medRooms(sanatoriumId);
    const sessions = tables.sessions.all().filter((s) => s.date === date && s.status !== "cancelled");
    return rooms.map((room) => ({ room, sessions: rowsFor(sessions.filter((s) => s.roomId === room.id).sort(bySchedule)) }));
  },

  async mark(id: string, status: SessionStatus): Promise<void> {
    await latency(250);
    const s = tables.sessions.find(id)!;
    tables.sessions.patch(id, { status, markedBy: session.get().staffId ?? undefined });
    const what = { done: "Процедура выполнена", missed: "Гость не пришёл на процедуру", planned: "Процедура возвращена в план", cancelled: "Процедура отменена" }[status];
    auditService.log("edit", `${what}: ${catalogService.procedure(s.procedureId).title.toLowerCase()}`, s.patientId);
  },

  /** Перенос сеанса на ближайшее свободное время (сегодня — не раньше «сейчас») */
  async reschedule(id: string): Promise<{ ok: boolean; text: string }> {
    await latency(400);
    const s = tables.sessions.find(id)!;
    const patient = tables.patients.find(s.patientId)!;
    const stay = stayOf(patient);
    if (!stay) return { ok: false, text: "У гостя нет проживания — перенос невозможен." };
    const others = tables.sessions.all().filter((x) => x.id !== id);
    const today = s.date > DEMO_TODAY ? s.date : DEMO_TODAY;
    const plan = planCourse(
      {
        procedures: catalogService.procedures(), rooms: catalogService.medRooms(stay.sanatoriumId), sessions: others,
        guestBusy: guestAppointments(patient.id, today, stay.to), stay, today,
        notBefore: Math.max(DEMO_NOW + 10, s.date === today ? s.start + 30 : 0),
      },
      { patientId: patient.id, procedureId: s.procedureId, total: 1, frequency: "once", from: today },
    );
    const next = plan.sessions[0];
    if (!next) return { ok: false, text: "До выезда гостя нет свободного времени для этой процедуры." };
    tables.sessions.patch(id, { date: next.date, start: next.start, end: next.end, roomId: next.roomId, status: "planned" });
    auditService.log("edit", `Перенос процедуры на ${fmtDay(next.date)}, ${fmtTime(next.start)}`, patient.id);
    return { ok: true, text: `Перенесено на ${fmtDay(next.date)}, ${fmtTime(next.start)} — кабинет №${catalogService.medRoom(next.roomId).number}` };
  },
};

export const prescriptionsService = {
  /** Назначения гостя с прогрессом курса: назначено / пройдено */
  async forPatient(patientId: string): Promise<CourseProgress[]> {
    await latency();
    const sessions = tables.sessions.all().filter((s) => s.patientId === patientId);
    return tables.prescriptions
      .all()
      .filter((p) => p.patientId === patientId && p.status === "active")
      .map((prescription) => {
        const own = sessions.filter((s) => s.prescriptionId === prescription.id && s.status !== "cancelled").sort(bySchedule);
        return {
          prescription,
          procedure: catalogService.procedure(prescription.procedureId),
          total: own.length,
          done: own.filter((s) => s.status === "done").length,
          missed: own.filter((s) => s.status === "missed").length,
          planned: own.filter((s) => s.status === "planned").length,
          next: own.find((s) => s.status === "planned"),
        };
      });
  },

  /** Предварительная раскладка — врач видит дни и конфликты до сохранения */
  async preview(patientId: string, procedureId: string, total: number, frequency: Frequency): Promise<PlanResult> {
    await latency(300);
    return plan(patientId, procedureId, total, frequency);
  },

  async add(patientId: string, procedureId: string, total: number, frequency: Frequency): Promise<PlanResult> {
    await latency(500);
    const result = plan(patientId, procedureId, total, frequency);
    if (!result.sessions.length) return result;
    const doctorId = session.get().staffId?.replace("st-", "") ?? "orlova";
    const id = uid("rx");
    tables.prescriptions.insert({
      id, patientId, procedureId, doctorId, total: result.sessions.length, frequency,
      from: result.sessions[0].date, createdAt: DEMO_TODAY, status: "active",
    });
    tables.sessions.insert(...result.sessions.map((s, k) => ({ ...s, id: `${id}-${k + 1}`, prescriptionId: id })));
    auditService.log("edit", `Назначен курс: ${catalogService.procedure(procedureId).title.toLowerCase()} × ${result.sessions.length}`, patientId);
    return result;
  },

  /** Отмена назначения: будущие сеансы снимаются, проведённые остаются в истории */
  async cancel(id: string): Promise<void> {
    await latency(300);
    const rx = tables.prescriptions.find(id)!;
    tables.prescriptions.patch(id, { status: "cancelled" });
    for (const s of tables.sessions.all().filter((x) => x.prescriptionId === id && x.status === "planned")) {
      tables.sessions.patch(s.id, { status: "cancelled" });
    }
    auditService.log("edit", `Отмена назначения: ${catalogService.procedure(rx.procedureId).title.toLowerCase()}`, rx.patientId);
  },
};

function plan(patientId: string, procedureId: string, total: number, frequency: Frequency): PlanResult {
  const patient = tables.patients.find(patientId)!;
  const stay = stayOf(patient);
  if (!stay) {
    return { sessions: [], conflicts: [{ kind: "stay_ends", text: "У пациента нет проживания в санатории — процедуры назначаются амбулаторно через онлайн-запись." }], summary: "Нет проживания" };
  }
  // Сегодня — начиная с ближайшего времени, иначе со следующего дня после заезда
  const from = stay.from >= DEMO_TODAY ? addDays(stay.from, 1) : DEMO_TODAY;
  return planCourse(
    {
      procedures: catalogService.procedures(), rooms: catalogService.medRooms(stay.sanatoriumId), sessions: tables.sessions.all(),
      guestBusy: guestAppointments(patientId, from, stay.to), stay, today: from, notBefore: from === DEMO_TODAY ? DEMO_NOW + 20 : 0,
    },
    { patientId, procedureId, total, frequency, from },
  );
}
