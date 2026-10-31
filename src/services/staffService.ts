/**
 * staffService — сотрудники сети и их роли.
 *
 * РЕАЛЬНЫЙ API: GET /staff?sanatoriumId — справочник сотрудников.
 */
import type { RoleId, SanatoriumId, Staff } from "@/lib/types";
import { DEMO_USER, STAFF } from "@/mock/mis/staff";
import { latency } from "./config";

export const staffShortName = (s: Staff) => `${s.lastName} ${s.firstName[0]}. ${s.patronymic[0]}.`;
export const staffFullName = (s: Staff) => `${s.lastName} ${s.firstName} ${s.patronymic}`;

export const staffService = {
  /** Синхронно: нужен оболочке МИС для шапки без задержки */
  byId: (id: string | null): Staff | undefined => STAFF.find((s) => s.id === id),

  /** ДЕМО: под каким сотрудником входим в выбранной роли */
  demoUser: (role: RoleId): Staff => STAFF.find((s) => s.id === DEMO_USER[role])!,

  async list(sanatoriumId: SanatoriumId | "all" = "all"): Promise<Staff[]> {
    await latency();
    return STAFF.filter((s) => sanatoriumId === "all" || s.sanatoriumId === sanatoriumId);
  },
};
