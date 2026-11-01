/**
 * reportsService — отчёты главного врача: качество лечения и дисциплина документации.
 *
 * Что делают врачи и чего не делают: приёмы, протоколы, подпись и отправка в ЕГИСЗ,
 * назначения и их выполнение, гости без первичного приёма, выезжающие без выписки.
 *
 * РЕАЛЬНЫЙ API: отчёты считает сервер по журналу и документам: GET /reports/quality?from&to
 */
import type { ISODate, Patient } from "@/lib/types";
import { db } from "@/mock/db";
import { tables } from "@/mock/mis/store";
import { DOCTORS } from "@/mock/catalog";
import { addDays, DEMO_NOW, DEMO_TODAY, daysBetween, nightsBetween } from "@/lib/time";
import { catalogService } from "./catalogService";
import { latency } from "./config";

export type Period = "today" | "week";

export interface DoctorRow {
  doctorId: string;
  name: string;
  specialty: string;
  appointments: number;
  protocols: number;
  unsigned: number;
  errors: number;
  courses: number;
  /** Выполнение назначений врача: проведено от прошедших сеансов, % (null — назначений нет) */
  execution: number | null;
  attention: boolean;
}

export interface AttentionItem {
  id: string;
  severity: "high" | "medium";
  title: string;
  detail: string;
  /** Кто отвечает */
  owner: string;
  href: string;
  patient?: Patient;
}

const doctorName = (id: string) => {
  const d = DOCTORS.find((x) => x.id === id);
  return d ? `${d.lastName} ${d.firstName[0]}. ${d.patronymic[0]}.` : "Врач";
};

export const reportsService = {
  async quality(period: Period = "week") {
    await latency();
    const from: ISODate = period === "today" ? DEMO_TODAY : addDays(DEMO_TODAY, -6);
    const dates = daysBetween(from, DEMO_TODAY);
    const inPeriod = (d: ISODate) => d >= from && d <= DEMO_TODAY;

    const appointments = dates.flatMap((d) => db.byDate(d)).filter((a) => a.kind === "visit" && a.status !== "cancelled");
    const documents = tables.documents.all();
    const prescriptions = tables.prescriptions.all().filter((p) => p.status === "active");
    const sessions = tables.sessions.all();
    // Прошедшие сеансы: до сегодняшнего дня или сегодня до «сейчас»
    const past = sessions.filter((s) => s.status !== "cancelled" && (s.date < DEMO_TODAY || (s.date === DEMO_TODAY && s.end <= DEMO_NOW)) && inPeriod(s.date));

    const doctors: DoctorRow[] = DOCTORS.map((d) => {
      const own = documents.filter((x) => x.doctorId === d.id);
      const rx = prescriptions.filter((p) => p.doctorId === d.id).map((p) => p.id);
      const rxPast = past.filter((s) => rx.includes(s.prescriptionId));
      const done = rxPast.filter((s) => s.status === "done").length;
      const unsigned = own.filter((x) => x.status === "draft" && x.date < DEMO_TODAY).length;
      const errors = own.filter((x) => x.status === "error").length;
      return {
        doctorId: d.id,
        name: doctorName(d.id),
        specialty: d.specialties[0],
        appointments: appointments.filter((a) => a.doctorId === d.id).length,
        protocols: own.filter((x) => x.kind === "protocol" && inPeriod(x.date)).length,
        unsigned,
        errors,
        courses: prescriptions.filter((p) => p.doctorId === d.id && inPeriod(p.createdAt)).length,
        execution: rxPast.length ? Math.round((done / rxPast.length) * 100) : null,
        attention: unsigned > 0 || errors > 0,
      };
    });

    /* --- Требует внимания: конкретные случаи со ссылкой, где исправить --- */
    const items: AttentionItem[] = [];
    const patients = tables.patients.all();
    const patientOf = (id: string) => patients.find((p) => p.id === id);

    for (const doc of documents.filter((x) => x.status === "error")) {
      const p = patientOf(doc.patientId);
      items.push({ id: `err-${doc.id}`, severity: "high", title: `ЕГИСЗ вернула документ: ${doc.title.toLowerCase()}`, detail: doc.errorText ?? "", owner: doctorName(doc.doctorId), href: "/mis/egisz", patient: p });
    }
    for (const doc of documents.filter((x) => x.status === "draft" && x.date < DEMO_TODAY)) {
      const p = patientOf(doc.patientId);
      items.push({ id: `draft-${doc.id}`, severity: "medium", title: `Не подписан ${nightsBetween(doc.date, DEMO_TODAY)} дн.: ${doc.title.toLowerCase()}`, detail: "Документ не уйдёт в ЕГИСЗ, пока врач его не подпишет", owner: doctorName(doc.doctorId), href: "/mis/egisz", patient: p });
    }
    // Гость заехал раньше сегодняшнего дня, а первичного приёма всё нет
    const visits = tables.visits.all();
    for (const p of patients.filter((x) => x.type === "guest" && x.stay && x.stay.from < DEMO_TODAY && !visits.some((v) => v.patientId === x.id))) {
      items.push({ id: `primary-${p.id}`, severity: "high", title: "Первичный приём не проведён в день заезда", detail: `Заезд ${p.stay!.from.slice(8)}.${p.stay!.from.slice(5, 7)}, приём назначен на сегодня — процедуры ещё не начаты`, owner: "Терапевты", href: `/mis/patient?id=${p.id}`, patient: p });
    }
    // Выезжает сегодня, а выписки нет или она не подписана
    for (const p of patients.filter((x) => x.stay?.to === DEMO_TODAY)) {
      const discharge = documents.find((d) => d.patientId === p.id && d.kind === "discharge");
      if (discharge && discharge.status !== "draft") continue;
      items.push({ id: `dis-${p.id}`, severity: "medium", title: discharge ? "Выписка не подписана, гость выезжает сегодня" : "Нет выписки, гость выезжает сегодня", detail: "Гость должен уехать с выписным эпикризом", owner: doctorName(discharge?.doctorId ?? "orlova"), href: `/mis/patient?id=${p.id}`, patient: p });
    }
    // Два и больше пропуска процедур — повод поговорить с гостем
    const missedBy = new Map<string, number>();
    for (const s of past.filter((x) => x.status === "missed")) missedBy.set(s.patientId, (missedBy.get(s.patientId) ?? 0) + 1);
    for (const [pid, n] of missedBy) {
      if (n < 2) continue;
      items.push({ id: `miss-${pid}`, severity: "medium", title: `Пропущено процедур: ${n}`, detail: "Уточните причину: самочувствие, неудобное время или перегрузка расписания", owner: "Лечащий врач", href: `/mis/patient?id=${pid}&tab=schedule`, patient: patientOf(pid) });
    }

    const pastDone = past.filter((s) => s.status === "done").length;
    const allDocs = documents.filter((d) => inPeriod(d.date));
    return {
      from,
      period,
      kpi: {
        appointments: appointments.filter((a) => a.date < DEMO_TODAY || a.end <= DEMO_NOW).length,
        signedShare: allDocs.length ? Math.round((allDocs.filter((d) => d.status !== "draft").length / allDocs.length) * 100) : 100,
        registered: allDocs.filter((d) => d.status === "registered").length,
        errors: documents.filter((d) => d.status === "error").length,
        execution: past.length ? Math.round((pastDone / past.length) * 100) : 100,
        missed: past.filter((s) => s.status === "missed").length,
      },
      doctors,
      attention: items.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1)),
      /** Самые назначаемые процедуры за период — для разговора о стандартах лечения */
      topProcedures: [...prescriptions.filter((p) => inPeriod(p.createdAt)).reduce((m, p) => m.set(p.procedureId, (m.get(p.procedureId) ?? 0) + 1), new Map<string, number>())]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([id, n]) => ({ label: catalogService.procedure(id).title, value: n })),
    };
  },
};

export type QualityReport = Awaited<ReturnType<typeof reportsService.quality>>;
