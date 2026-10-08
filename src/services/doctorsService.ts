/**
 * doctorsService — врачи, специализации, смены, направления.
 *
 * РЕАЛЬНЫЙ API: заменить mock-ветку на вызовы integrationService:
 *   GET /doctors            — список врачей, ID, специальности
 *   GET /doctors/{id}/shifts — рабочие смены
 *   GET /specialties        — направления
 *   GET /services           — услуги и их продолжительность
 */
import type { Direction, Doctor, DoctorStatus, ISODate, Service } from "@/lib/types";
import { DIRECTIONS, DOCTORS, SERVICES } from "@/mock/catalog";
import { doctorDayStatus } from "@/lib/scheduling/engine";
import { latency } from "./config";

export const doctorsService = {
  async list(): Promise<Doctor[]> {
    await latency();
    return DOCTORS;
  },
  async get(id: string): Promise<Doctor | undefined> {
    await latency();
    return DOCTORS.find((d) => d.id === id);
  },
  async byDirection(directionId: string): Promise<Doctor[]> {
    await latency();
    return DOCTORS.filter((d) => d.directionIds.includes(directionId));
  },
  async directions(): Promise<Direction[]> {
    await latency();
    return DIRECTIONS;
  },
  async services(doctorId?: string): Promise<Service[]> {
    await latency();
    return doctorId ? SERVICES.filter((s) => s.doctorIds.includes(doctorId)) : SERVICES;
  },
  async service(id: string): Promise<Service | undefined> {
    await latency();
    return SERVICES.find((s) => s.id === id);
  },
  /** Статус врача на дату: на смене / не на смене / отпуск / больничный */
  async statusOn(id: string, date: ISODate): Promise<DoctorStatus> {
    await latency();
    return doctorDayStatus(DOCTORS.find((d) => d.id === id)!, date);
  },
};
