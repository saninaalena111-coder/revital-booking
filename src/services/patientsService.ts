/**
 * patientsService — идентификация гостя и профиль пациента.
 *
 * РЕАЛЬНЫЙ API: POST /patients/lookup { phone, lastName } → ID пациента в МИС
 * и данные проживания. Медицинская карта для онлайн-записи НЕ запрашивается.
 */
import type { Patient } from "@/lib/types";
import { CURRENT_PATIENT_ID, PATIENTS } from "@/mock/people";
import { latency } from "./config";

export const patientsService = {
  /** Поиск бронирования проживания. В демо — любой телефон и фамилия находят Анну Смирнову */
  async findGuestBooking(phone: string, lastName: string): Promise<Patient | null> {
    // РЕАЛЬНЫЙ API: return integrationService.lookupGuest({ phone, lastName })
    void [phone, lastName];
    await latency(900);
    return PATIENTS[0];
  },
  async current(): Promise<Patient> {
    await latency();
    return PATIENTS.find((p) => p.id === CURRENT_PATIENT_ID)!;
  },
};
