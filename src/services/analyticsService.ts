/**
 * analyticsService — показатели записей и источники обращений.
 *
 * Эти данные принадлежат Revital Medical Booking (не МИС):
 * UTM-метки и источник сохраняются в момент онлайн-записи.
 * РЕАЛЬНАЯ ВЕРСИЯ: агрегаты из собственной базы на сервере.
 */
import type { Attribution } from "@/lib/types";
import { DASHBOARD_STATS, RECENT_ATTRIBUTED } from "@/mock/people";
import { db } from "@/mock/db";
import { SERVICES } from "@/mock/catalog";
import { dayNum, fmtDay, fmtTime } from "@/lib/time";
import { latency } from "./config";

export interface AttributedRow {
  id: string;
  patient: string;
  doctorId: string;
  service: string;
  when: string;
  a: Attribution;
  fresh?: boolean;
}

export const analyticsService = {
  async dashboard() {
    await latency();
    return DASHBOARD_STATS;
  },
  async attributed(): Promise<AttributedRow[]> {
    await latency();
    const seeded = new Set(["a-anna-1011", "a-s1", "a-s2"]);
    const fresh: AttributedRow[] = db
      .touchable()
      .filter((a) => a.createdVia === "online" && a.attribution && !seeded.has(a.id) && !a.id.startsWith("a-anna-h"))
      .reverse()
      .map((a) => ({
        id: a.id,
        patient: a.patientName,
        doctorId: a.doctorId,
        service: SERVICES.find((s) => s.id === a.serviceId)?.title ?? "",
        when: `${dayNum(a.date)} ${fmtDay(a.date).split(" ")[1].slice(0, 3)}, ${fmtTime(a.start)}`,
        a: a.attribution!,
        fresh: true,
      }));
    return [...fresh, ...RECENT_ATTRIBUTED.map((r, i) => ({ ...r, id: `r-${i}` }))];
  },
};
