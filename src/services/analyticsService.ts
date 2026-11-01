/**
 * analyticsService — показатели записей и источники обращений.
 *
 * Эти данные принадлежат Онлайн-запись Ревиталь (не МИС):
 * UTM-метки и источник сохраняются в момент онлайн-записи.
 * РЕАЛЬНАЯ ВЕРСИЯ: агрегаты из собственной базы на сервере.
 */
import type { Attribution, ISODate, SanatoriumId, Stay } from "@/lib/types";
import { DASHBOARD_STATS, RECENT_ATTRIBUTED } from "@/mock/people";
import { db } from "@/mock/db";
import { DOCTORS, SERVICES } from "@/mock/catalog";
import { PROCEDURES } from "@/mock/mis/catalog";
import { hotelRooms, tables } from "@/mock/mis/store";
import { REVITAL } from "@/config/tenant";
import { addDays, dayNum, DEMO_TODAY, fmtDay, fmtTime, nightsBetween } from "@/lib/time";
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
  /** Сводная панель руководителя: загрузка, выручка, записи, источники, процедуры, врачи */
  network: (scope: SanatoriumId | "all") => networkSummary(scope),

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

/* ===================== Сводная панель руководителя (МИС) ===================== */

export interface NetworkSummary {
  sanatoriums: {
    id: SanatoriumId; title: string; short: string; kind: "sanatorium" | "spa";
    rooms: number; occupancyToday: number; occupancy30: number; revenue30: number; living: number;
    /** СПА-клубы: посещений за 30 дней (демо) */
    visits30?: number;
  }[];
  /** Загрузка на 30 дней вперёд, % по дням — для каждого объекта */
  forecast: { dates: ISODate[]; series: { id: SanatoriumId; title: string; values: number[] }[] };
  kpi: { occupancyToday: number; revenue30: number; living: number; appointmentsToday: number; onlineShare: number; proceduresDone: number; proceduresTotal: number };
  sources: { label: string; value: number }[];
  topProcedures: { label: string; value: number }[];
  doctorsLoad: { label: string; sub: string; percent: number; visits: number }[];
}

const sanOf = (s: Stay) => s.sanatoriumId;

export async function networkSummary(scope: SanatoriumId | "all"): Promise<NetworkSummary> {
  await latency();
  const stays = tables.stays.all().filter((s) => s.status !== "cancelled");
  const rooms = hotelRooms().filter((r) => !r.repair);
  const forecastDates = Array.from({ length: 30 }, (_, i) => addDays(DEMO_TODAY, i));
  const pastDates = Array.from({ length: 30 }, (_, i) => addDays(DEMO_TODAY, i - 30));
  const occ = (id: SanatoriumId, date: ISODate) => {
    const n = rooms.filter((r) => r.sanatoriumId === id).length;
    return n ? Math.round((stays.filter((s) => sanOf(s) === id && s.from <= date && date < s.to).length / n) * 100) : 0;
  };
  // Выручка (демо): стоимость брони, разложенная по ночам за последние 30 дней
  const revenue = (id: SanatoriumId) =>
    stays.filter((s) => sanOf(s) === id).reduce((sum, s) => {
      const perNight = s.amountRub / Math.max(1, nightsBetween(s.from, s.to));
      return sum + pastDates.filter((d) => s.from <= d && d < s.to).length * perNight;
    }, 0);

  // СПА-клубы без номеров: посещения и выручка по процедурам — детерминированный демо-расчёт
  const spaVisits = (id: SanatoriumId) => (id === "spa-moscow" ? 1460 : 980);
  const SPA_CHECK = 6200;

  const ids = REVITAL.sanatoriums.map((s) => s.id).filter((id) => scope === "all" || id === scope);
  const sanatoriums = ids.map((id) => {
    const cfg = REVITAL.sanatoriums.find((s) => s.id === id)!;
    if (cfg.kind === "spa") {
      return { id, title: cfg.title, short: cfg.short, kind: cfg.kind, rooms: 0, occupancyToday: 0, occupancy30: 0, living: 0, visits30: spaVisits(id), revenue30: spaVisits(id) * SPA_CHECK };
    }
    return {
      id, title: cfg.title, short: cfg.short, kind: cfg.kind,
      rooms: rooms.filter((r) => r.sanatoriumId === id).length,
      occupancyToday: occ(id, DEMO_TODAY),
      occupancy30: Math.round(forecastDates.reduce((s, d) => s + occ(id, d), 0) / forecastDates.length),
      revenue30: Math.round(revenue(id)),
      living: stays.filter((s) => sanOf(s) === id && s.from <= DEMO_TODAY && DEMO_TODAY < s.to).length,
    };
  });

  const totalRooms = sanatoriums.reduce((s, x) => s + x.rooms, 0);
  const living = sanatoriums.reduce((s, x) => s + x.living, 0);
  const gelCenter = ids.includes("gelendzhik") || ids.includes("gelendzhik5");
  const todayAppointments = gelCenter ? db.byDate(DEMO_TODAY).filter((a) => a.kind === "visit" && a.status !== "cancelled") : [];
  const sessionsToday = gelCenter ? tables.sessions.all().filter((s) => s.date === DEMO_TODAY && s.status !== "cancelled") : [];

  // Источники гостей: откуда пришли брони за 60 дней
  const window = stays.filter((s) => ids.includes(s.sanatoriumId) && s.createdAt >= addDays(DEMO_TODAY, -60));
  const sources = Object.entries(window.reduce<Record<string, number>>((acc, s) => ((acc[s.source] = (acc[s.source] ?? 0) + 1), acc), {}))
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Популярные процедуры за последние 14 дней
  const from14 = addDays(DEMO_TODAY, -14);
  const counts = new Map<string, number>();
  if (gelCenter) {
    for (const s of tables.sessions.all()) if (s.status === "done" && s.date >= from14) counts.set(s.procedureId, (counts.get(s.procedureId) ?? 0) + 1);
  }
  const topProcedures = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id, value]) => ({ label: PROCEDURES.find((p) => p.id === id)!.title, value }));

  // Нагрузка врачей Геленджика сегодня: занятое время от смены
  const doctorsLoad = gelCenter
    ? DOCTORS.map((d) => {
        const list = todayAppointments.filter((a) => a.doctorId === d.id);
        const busy = db.byDate(DEMO_TODAY).filter((a) => a.doctorId === d.id && a.status !== "cancelled").reduce((s, a) => s + a.end - a.start, 0);
        const shift = d.shiftEnd - d.shiftStart;
        return { label: `${d.lastName} ${d.firstName[0]}. ${d.patronymic[0]}.`, sub: d.specialties[0], percent: Math.min(100, Math.round((busy / shift) * 100)), visits: list.length };
      }).sort((a, b) => b.percent - a.percent)
    : [];

  return {
    sanatoriums,
    forecast: { dates: forecastDates, series: sanatoriums.filter((s) => s.kind === "sanatorium").map((s) => ({ id: s.id, title: s.short, values: forecastDates.map((d) => occ(s.id, d)) })) },
    kpi: {
      occupancyToday: totalRooms ? Math.round((living / totalRooms) * 100) : 0,
      revenue30: sanatoriums.reduce((s, x) => s + x.revenue30, 0),
      living,
      appointmentsToday: todayAppointments.length,
      onlineShare: todayAppointments.length ? Math.round((todayAppointments.filter((a) => a.createdVia === "online").length / todayAppointments.length) * 100) : 0,
      proceduresDone: sessionsToday.filter((s) => s.status === "done").length,
      proceduresTotal: sessionsToday.length,
    },
    sources,
    topProcedures,
    doctorsLoad,
  };
}
