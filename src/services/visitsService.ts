/**
 * visitsService — приём врача: «Мой день», осмотр по шаблону, протокол.
 * documentsService — медицинские документы и их путь в ЕГИСЗ.
 * labsService — результаты анализов.
 *
 * Запись к врачу (Appointment) приходит из онлайн-записи, а осмотр (Visit) и документы
 * создаёт МИС. Связь — через appointmentId: запись гостя с сайта сразу видна врачу.
 *
 * РЕАЛЬНЫЙ API:
 *   GET  /doctors/{id}/day?date          POST /visits        PATCH /visits/{id}
 *   GET  /documents?status               POST /documents/{id}/sign   POST /documents/{id}/send (через N3.Health)
 */
import type {
  Appointment, DocStatus, ISODate, LabResult, MedDocument, Patient, SanatoriumId, Visit,
} from "@/lib/types";
import { db } from "@/mock/db";
import { labs, tables } from "@/mock/mis/store";
import { DOCTORS, SERVICES } from "@/mock/catalog";
import { DEMO_TODAY, fmtDay } from "@/lib/time";
import { catalogService } from "./catalogService";
import { auditService } from "./auditService";
import { latency, uid } from "./config";

export type DayItemStatus = "waiting" | "in_progress" | "done" | "missed";

export interface DayItem {
  appointment: Appointment;
  patient?: Patient;
  visit?: Visit;
  serviceTitle: string;
  status: DayItemStatus;
}

export const DAY_STATUS_LABEL: Record<DayItemStatus, string> = {
  waiting: "Ожидает",
  in_progress: "Идёт приём",
  done: "Приём завершён",
  missed: "Не пришёл",
};

export const DOC_STATUS_LABEL: Record<DocStatus, string> = {
  draft: "Черновик",
  signed: "Подписан врачом",
  sent: "Отправлен в N3.Health",
  registered: "Зарегистрирован в РЭМД",
  error: "Ошибка",
};

const doctorName = (id: string) => {
  const d = DOCTORS.find((x) => x.id === id);
  return d ? `${d.lastName} ${d.firstName[0]}. ${d.patronymic[0]}.` : "Врач";
};

function protocolBody(v: Visit) {
  return [
    { heading: "Жалобы", text: v.complaints || "—" },
    { heading: "Анамнез", text: v.anamnesis || "—" },
    { heading: "Объективно", text: v.objective || "—" },
    { heading: "Диагноз", text: v.diagnoses.map((d) => `${d.code} — ${d.title}`).join("; ") || "—" },
    { heading: "Рекомендации", text: v.recommendations || "—" },
  ];
}

export const visitsService = {
  doctorName,

  /** «Мой день» врача: записи на дату с пациентами и состоянием приёма */
  async doctorDay(doctorId: string, date: ISODate = DEMO_TODAY): Promise<DayItem[]> {
    await latency();
    const visits = tables.visits.all();
    return db
      .byDate(date)
      .filter((a) => a.doctorId === doctorId && a.kind === "visit" && a.status !== "cancelled")
      .sort((a, b) => a.start - b.start)
      .map((appointment) => {
        const visit = visits.find((v) => v.appointmentId === appointment.id);
        // Прошедшие дни считаются принятыми; сегодня статус ведёт сам врач — по осмотру
        const status: DayItemStatus = visit
          ? visit.status === "done" ? "done" : "in_progress"
          : appointment.status === "completed" || date < DEMO_TODAY ? "done" : "waiting";
        return {
          appointment,
          patient: appointment.patientId ? tables.patients.find(appointment.patientId) : undefined,
          visit,
          serviceTitle: SERVICES.find((s) => s.id === appointment.serviceId)?.title ?? "Приём",
          status,
        };
      });
  },

  async forPatient(patientId: string): Promise<Visit[]> {
    await latency();
    return tables.visits.all().filter((v) => v.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date) || b.start - a.start);
  },

  async get(id: string): Promise<Visit | undefined> {
    await latency();
    return tables.visits.find(id);
  },

  /** «Начать приём»: создаёт осмотр по записи (или открывает уже начатый) */
  async start(appointmentId: string): Promise<Visit> {
    await latency(300);
    const existing = tables.visits.all().find((v) => v.appointmentId === appointmentId);
    if (existing) return existing;
    const a = db.find(appointmentId) ?? db.byDate(DEMO_TODAY).find((x) => x.id === appointmentId)!;
    const primary = a.serviceId === "ther-primary" || !tables.visits.all().some((v) => v.patientId === a.patientId);
    const visit: Visit = {
      id: uid("v"), patientId: a.patientId!, doctorId: a.doctorId, appointmentId, date: a.date, start: a.start,
      kind: primary ? "primary" : "repeat", status: "in_progress",
      complaints: "", anamnesis: "", objective: "", diagnoses: [], recommendations: "",
    };
    tables.visits.insert(visit);
    auditService.log("view", "Начало приёма, открыта карта гостя", visit.patientId);
    return visit;
  },

  async save(id: string, patch: Partial<Visit>): Promise<void> {
    await latency(150);
    tables.visits.patch(id, patch);
  },

  /** Завершить приём: протокол уходит в документы черновиком для подписи */
  async finish(id: string): Promise<MedDocument> {
    await latency(500);
    tables.visits.patch(id, { status: "done" });
    const v = tables.visits.find(id)!;
    if (v.appointmentId && db.find(v.appointmentId)) db.patch(v.appointmentId, { status: "completed" });
    const doc: MedDocument = {
      id: uid("doc"), patientId: v.patientId, kind: "protocol",
      title: v.kind === "primary" ? "Протокол первичного приёма" : "Протокол повторного приёма",
      date: v.date, doctorId: v.doctorId, status: "draft", visitId: v.id, body: protocolBody(v),
    };
    tables.documents.insert(doc);
    auditService.log("edit", "Приём завершён, протокол сохранён", v.patientId);
    return doc;
  },
};

/* ===================== Документы и ЕГИСЗ ===================== */

export interface DocRow {
  doc: MedDocument;
  patient: Patient;
  doctor: string;
}

export const documentsService = {
  async list(f: { sanatoriumId?: SanatoriumId | "all"; status?: DocStatus | "all"; doctorId?: string } = {}): Promise<DocRow[]> {
    await latency();
    return tables.documents
      .all()
      .map((doc) => ({ doc, patient: tables.patients.find(doc.patientId)!, doctor: doctorName(doc.doctorId) }))
      .filter((r) => !f.sanatoriumId || f.sanatoriumId === "all" || r.patient.sanatoriumId === f.sanatoriumId)
      .filter((r) => !f.status || f.status === "all" || r.doc.status === f.status)
      .filter((r) => !f.doctorId || r.doc.doctorId === f.doctorId)
      .sort((a, b) => b.doc.date.localeCompare(a.doc.date));
  },

  async forPatient(patientId: string): Promise<MedDocument[]> {
    await latency();
    return tables.documents.all().filter((d) => d.patientId === patientId).sort((a, b) => b.date.localeCompare(a.date));
  },

  async get(id: string): Promise<MedDocument | undefined> {
    await latency();
    return tables.documents.find(id);
  },

  /** Подпись врача. В рабочей версии — облачная электронная подпись с подтверждением в телефоне */
  async sign(id: string): Promise<void> {
    await latency(300);
    tables.documents.patch(id, { status: "signed", errorText: undefined });
    auditService.log("sign", `Подпись документа: ${tables.documents.find(id)!.title.toLowerCase()}`, tables.documents.find(id)!.patientId);
  },

  /**
   * Отправка в ЕГИСЗ через N3.Health. В демо: «Отправлен» сразу,
   * «Зарегистрирован в РЭМД» — через несколько секунд, как ответ сервиса.
   */
  async send(id: string): Promise<void> {
    await latency(400);
    const doc = tables.documents.find(id)!;
    tables.documents.patch(id, { status: "sent" });
    auditService.log("send", `Отправка в ЕГИСЗ: ${doc.title.toLowerCase()}`, doc.patientId);
    setTimeout(() => {
      if (tables.documents.find(id)?.status !== "sent") return;
      tables.documents.patch(id, { status: "registered", remdId: `РЭМД-${String(Date.now()).slice(-7)}` });
    }, 3500);
  },

  /** «Исправить»: врач устранил причину отказа — документ снова готов к отправке */
  async fix(id: string): Promise<void> {
    await latency(300);
    tables.documents.patch(id, { status: "signed", errorText: undefined });
  },

  /** Выписной эпикриз из данных карты — одной кнопкой */
  async createDischarge(patientId: string, doctorId: string): Promise<MedDocument> {
    await latency(600);
    const patient = tables.patients.find(patientId)!;
    const stay = patient.stayId ? tables.stays.find(patient.stayId) : undefined;
    const visits = tables.visits.all().filter((v) => v.patientId === patientId && v.status === "done");
    const sessions = tables.sessions.all().filter((s) => s.patientId === patientId && s.status === "done");
    const counts = new Map<string, number>();
    for (const s of sessions) counts.set(s.procedureId, (counts.get(s.procedureId) ?? 0) + 1);
    const diagnoses = visits.flatMap((v) => v.diagnoses).filter((d, i, a) => a.findIndex((x) => x.code === d.code) === i);
    const doc: MedDocument = {
      id: uid("doc"), patientId, kind: "discharge", title: "Выписной эпикриз", date: DEMO_TODAY, doctorId, status: "draft",
      body: [
        {
          heading: "Период лечения",
          text: stay ? `${fmtDay(stay.from)} — ${fmtDay(stay.to)}, программа «${catalogService.program(stay.programId).title}»` : "Амбулаторное лечение",
        },
        { heading: "Диагноз", text: diagnoses.map((d) => `${d.code} — ${d.title}`).join("; ") || "—" },
        {
          heading: "Проведённое лечение",
          text: [...counts].map(([id, n]) => `${catalogService.procedure(id).title} — ${n}`).join("; ") || "Процедуры не проводились",
        },
        { heading: "Результат", text: "Состояние улучшилось. Жалобы уменьшились, переносимость нагрузок повысилась." },
        { heading: "Рекомендации", text: "Продолжить лечебную гимнастику дома. Наблюдение терапевта по месту жительства. Повторный курс через 6–12 месяцев." },
      ],
    };
    tables.documents.insert(doc);
    auditService.log("edit", "Сформирован выписной эпикриз", patientId);
    return doc;
  },
};

export const labsService = {
  async forPatient(patientId: string): Promise<LabResult[]> {
    await latency();
    return labs().filter((l) => l.patientId === patientId);
  },
};
