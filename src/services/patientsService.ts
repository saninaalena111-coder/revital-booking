/**
 * patientsService — гости и пациенты: идентификация для онлайн-записи и медицинская карта МИС.
 *
 * РЕАЛЬНЫЙ API:
 *   POST /patients/lookup { phone, lastName } → ID пациента и данные проживания (онлайн-запись)
 *   GET  /patients?sanatoriumId&type&q          → список гостей (МИС)
 *   GET  /patients/{id}                          → карта гостя (МИС, только для медперсонала)
 */
import type { Patient, PatientType, SanatoriumId } from "@/lib/types";
import { CURRENT_PATIENT_ID } from "@/mock/people";
import { tables } from "@/mock/mis/store";
import { ageOn } from "@/lib/time";
import { latency } from "./config";

export const patientShortName = (p: Patient) => `${p.lastName} ${p.firstName[0]}.${p.patronymic ? ` ${p.patronymic[0]}.` : ""}`;
export const patientFullName = (p: Patient) => [p.lastName, p.firstName, p.patronymic].filter(Boolean).join(" ");
export const patientAge = (p: Patient) => (p.birthDate ? ageOn(p.birthDate) : null);

export const PATIENT_TYPE_LABEL: Record<PatientType, string> = {
  guest: "Гость санатория",
  future_guest: "Будущий гость",
  outpatient: "Амбулаторный пациент",
};

export interface PatientFilter {
  sanatoriumId?: SanatoriumId | "all";
  type?: PatientType | "all";
  q?: string;
}

export const patientsService = {
  /** Поиск бронирования проживания. В демо — любой телефон и фамилия находят Анну Смирнову */
  async findGuestBooking(phone: string, lastName: string): Promise<Patient | null> {
    // РЕАЛЬНЫЙ API: return integrationService.lookupGuest({ phone, lastName })
    void [phone, lastName];
    await latency(900);
    return tables.patients.find(CURRENT_PATIENT_ID)!;
  },

  /** Пациент «этого устройства» — владелец личного кабинета в демо */
  async current(): Promise<Patient> {
    await latency();
    return tables.patients.find(CURRENT_PATIENT_ID)!;
  },

  async list(f: PatientFilter = {}): Promise<Patient[]> {
    await latency();
    const q = f.q?.trim().toLowerCase();
    return tables.patients
      .all()
      .filter((p) => !f.sanatoriumId || f.sanatoriumId === "all" || p.sanatoriumId === f.sanatoriumId)
      .filter((p) => !f.type || f.type === "all" || p.type === f.type)
      .filter((p) => !q || `${patientFullName(p)} ${p.phone} ${p.stay?.roomNumber ?? ""}`.toLowerCase().includes(q))
      .sort((a, b) => a.lastName.localeCompare(b.lastName, "ru"));
  },

  async get(id: string): Promise<Patient | undefined> {
    await latency();
    return tables.patients.find(id);
  },

  async update(id: string, patch: Partial<Patient>): Promise<void> {
    await latency(200);
    tables.patients.patch(id, patch);
  },
};
