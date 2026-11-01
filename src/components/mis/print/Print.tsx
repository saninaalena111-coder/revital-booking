"use client";

import { Printer } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { MedDocument, Patient } from "@/lib/types";
import { REVITAL } from "@/config/tenant";
import { FREQUENCY_LABEL } from "@/lib/scheduling/planner";
import {
  catalogService, patientAge, patientFullName, visitsService,
  type CourseProgress, type SessionRow,
} from "@/services";
import { DEMO_TODAY, fmtDay, fmtRange, fmtTime, fmtWeekdayLong } from "@/lib/time";

/**
 * Печать через браузер: нужный документ рендерится в отдельный слой на A4,
 * всё остальное на время печати скрыто (см. .print-portal в globals.css).
 */
export function usePrint() {
  const [node, setNode] = useState<ReactNode | null>(null);

  useEffect(() => {
    if (!node) return;
    document.body.classList.add("printing-portal");
    const done = () => {
      document.body.classList.remove("printing-portal");
      setNode(null);
    };
    window.addEventListener("afterprint", done, { once: true });
    // Даём браузеру отрисовать слой перед печатью
    const t = setTimeout(() => window.print(), 80);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
      document.body.classList.remove("printing-portal");
    };
  }, [node]);

  return {
    print: (n: ReactNode) => setNode(n),
    portal: node ? createPortal(<div className="print-portal">{node}</div>, document.body) : null,
  };
}

/** Кнопка печати: собирает данные и отправляет документ на печать */
export function PrintButton({ label, make, className = "" }: { label: string; make: () => Promise<ReactNode> | ReactNode; className?: string }) {
  const { print, portal } = usePrint();
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          print(await make());
          setBusy(false);
        }}
        className={`inline-flex h-11 items-center justify-center gap-2 rounded-full border border-forest/25 px-5 text-[15px] font-medium text-forest transition hover:border-forest hover:bg-forest/[0.04] disabled:opacity-50 print:hidden ${className}`}
      >
        <Printer size={16} /> {label}
      </button>
      {portal}
    </>
  );
}

/* ===================== Бланк ===================== */

function Sheet({ title, patient, children, doctor }: { title: string; patient?: Patient; children: ReactNode; doctor?: string }) {
  const san = REVITAL.sanatoriums.find((s) => s.id === (patient?.sanatoriumId ?? "gelendzhik"))!;
  return (
    <article className="print-sheet">
      <header className="print-head">
        <div>
          <div className="print-brand">РЕВИТАЛЬ</div>
          <div className="print-muted">{san.title}</div>
          <div className="print-muted">{san.address}</div>
        </div>
        <div className="print-muted" style={{ textAlign: "right" }}>
          Дата печати: {fmtDay(DEMO_TODAY)} 2026 г.
          <br />
          Медицинская информационная система
        </div>
      </header>
      <h1 className="print-title">{title}</h1>
      {patient && (
        <table className="print-facts">
          <tbody>
            <tr><th>Пациент</th><td>{patientFullName(patient)}, {patientAge(patient)} лет</td><th>Карта</th><td>{patient.misId}</td></tr>
            {patient.stay && <tr><th>Номер</th><td>№ {patient.stay.roomNumber}</td><th>Проживание</th><td>{fmtDay(patient.stay.from)} — {fmtDay(patient.stay.to)}</td></tr>}
            <tr>
              <th>Программа</th><td>{patient.programId ? catalogService.program(patient.programId).title : "—"}</td>
              <th>Диетстол</th><td>{patient.dietTableId ? catalogService.dietTable(patient.dietTableId).title : "—"}</td>
            </tr>
            <tr><th>Аллергии</th><td colSpan={3}><b>{patient.allergies?.length ? patient.allergies.join(", ") : "нет"}</b></td></tr>
          </tbody>
        </table>
      )}
      {children}
      <footer className="print-foot">
        <span>{doctor ? `Врач: ${doctor}  ____________ (подпись)` : "Ответственный: ____________ (подпись)"}</span>
        <span>Демонстрационный прототип · данные вымышлены</span>
      </footer>
    </article>
  );
}

/* ===================== Документы для печати ===================== */

export function PrintPrescriptions({ patient, course }: { patient: Patient; course: CourseProgress[] }) {
  const doctor = course[0] ? visitsService.doctorName(course[0].prescription.doctorId) : undefined;
  return (
    <Sheet title="Лист назначений" patient={patient} doctor={doctor}>
      {!course.length ? (
        <p>Назначений нет.</p>
      ) : (
        <table className="print-table">
          <thead>
            <tr><th>№</th><th>Процедура</th><th>Кабинет</th><th>Частота</th><th>Курс</th><th>Пройдено</th><th>Следующая</th></tr>
          </thead>
          <tbody>
            {course.map((c, i) => (
              <tr key={c.prescription.id}>
                <td>{i + 1}</td>
                <td>{c.procedure.title}<div className="print-muted">{c.procedure.durationMin} мин{c.procedure.caution ? ` · ${c.procedure.caution}` : ""}</div></td>
                <td>№{catalogService.medRoom(c.procedure.roomIds[0]).number}</td>
                <td>{FREQUENCY_LABEL[c.prescription.frequency]}</td>
                <td>{c.total}</td>
                <td>{c.done}{c.missed ? ` (пропущено ${c.missed})` : ""}</td>
                <td>{c.next ? `${fmtDay(c.next.date)}, ${fmtTime(c.next.start)}` : "курс завершён"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="print-muted" style={{ marginTop: 12 }}>Время процедур подобрано системой с учётом кабинетов, мест и питания гостя.</p>
    </Sheet>
  );
}

export interface ScheduleItem {
  date: string;
  start: number;
  end: number;
  title: string;
  where: string;
  done?: boolean;
}

export function PrintSchedule({ patient, items, forGuest = false }: { patient: Patient; items: ScheduleItem[]; forGuest?: boolean }) {
  const upcoming = items.filter((i) => i.date >= DEMO_TODAY);
  const days = [...new Set(upcoming.map((i) => i.date))];
  return (
    <Sheet title={forGuest ? "Моё расписание процедур" : "Расписание гостя"} patient={forGuest ? undefined : patient}>
      {forGuest && <p><b>{patientFullName(patient)}</b>{patient.stay && ` · номер ${patient.stay.roomNumber} · выезд ${fmtDay(patient.stay.to)} до 12:00`}</p>}
      {days.map((d) => (
        <section key={d} className="print-day">
          <h2>{d === DEMO_TODAY ? "Сегодня" : <span style={{ textTransform: "capitalize" }}>{fmtWeekdayLong(d)}</span>}, {fmtDay(d)}</h2>
          <table className="print-table">
            <tbody>
              {upcoming.filter((i) => i.date === d).map((i) => (
                <tr key={`${i.date}-${i.start}-${i.title}`}>
                  <td style={{ width: 110 }}>{fmtRange(i.start, i.end)}</td>
                  <td>{i.title}</td>
                  <td>{i.where}</td>
                  <td style={{ width: 70 }}>{i.done ? "✓" : "☐"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {!days.length && <p>Предстоящих процедур нет.</p>}
      <p className="print-muted" style={{ marginTop: 12 }}>Завтрак 08:00–10:00 · обед 13:00–15:00 · ужин 18:00–20:00. Приходите за 5 минут до процедуры.</p>
    </Sheet>
  );
}

export function PrintCard({ patient, course, visits, docs }: { patient: Patient; course: CourseProgress[]; visits: Awaited<ReturnType<typeof visitsService.forPatient>>; docs: MedDocument[] }) {
  const diagnoses = visits.flatMap((v) => v.diagnoses).filter((d, i, a) => a.findIndex((x) => x.code === d.code) === i);
  return (
    <Sheet title="Медицинская карта гостя (выписка из карты)" patient={patient} doctor={visits[0] ? visitsService.doctorName(visits[0].doctorId) : undefined}>
      <h2 className="print-h2">Диагнозы</h2>
      <p>{diagnoses.length ? diagnoses.map((d) => `${d.code} — ${d.title}`).join("; ") : "Первичный приём ещё не проведён"}</p>
      <h2 className="print-h2">Приёмы</h2>
      {visits.length ? (
        <table className="print-table">
          <tbody>
            {visits.map((v) => (
              <tr key={v.id}>
                <td style={{ width: 110 }}>{fmtDay(v.date)}, {fmtTime(v.start)}</td>
                <td>{v.kind === "primary" ? "Первичный приём" : "Повторный приём"} · {visitsService.doctorName(v.doctorId)}</td>
                <td>{v.complaints || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p>Приёмов не было.</p>}
      <h2 className="print-h2">Курс процедур</h2>
      {course.length ? (
        <table className="print-table">
          <tbody>
            {course.map((c) => (
              <tr key={c.prescription.id}><td>{c.procedure.title}</td><td style={{ width: 160 }}>{FREQUENCY_LABEL[c.prescription.frequency]}</td><td style={{ width: 120 }}>{c.done} из {c.total}</td></tr>
            ))}
          </tbody>
        </table>
      ) : <p>Назначений нет.</p>}
      <h2 className="print-h2">Документы</h2>
      <p>{docs.length ? docs.map((d) => `${d.title} (${fmtDay(d.date)})`).join("; ") : "Документов нет"}</p>
    </Sheet>
  );
}

export function PrintDocument({ doc, patient }: { doc: MedDocument; patient: Patient }) {
  return (
    <Sheet title={doc.title} patient={patient} doctor={visitsService.doctorName(doc.doctorId)}>
      {doc.body.map((b) => (
        <section key={b.heading} style={{ marginTop: 10 }}>
          <h2 className="print-h2">{b.heading}</h2>
          <p style={{ whiteSpace: "pre-line" }}>{b.text}</p>
        </section>
      ))}
      <p className="print-muted" style={{ marginTop: 14 }}>
        {doc.status === "draft" ? "Черновик — документ не подписан." : `Подписано электронной подписью${doc.remdId ? ` · рег. номер ${doc.remdId}` : ""}.`}
      </p>
    </Sheet>
  );
}

export function PrintKitchen({ title, date, kitchen }: { title: string; date: string; kitchen: { restaurant: { title: string; preorder?: boolean }; persons: number; byTable: { table: { title: string }; count: number }[]; dishes: { dish: { title: string; meal: string }; count: number }[] }[] }) {
  const meals = [["breakfast", "Завтрак"], ["lunch", "Обед"], ["dinner", "Ужин"]] as const;
  return (
    <Sheet title={`Сводка для кухни на ${fmtDay(date)}`}>
      <p>{title}</p>
      {kitchen.map((k) => (
        <section key={k.restaurant.title} className="print-day">
          <h2>«{k.restaurant.title}» — гостей: {k.persons}</h2>
          <table className="print-table">
            <tbody>{k.byTable.map((t) => <tr key={t.table.title}><td>{t.table.title}</td><td style={{ width: 80 }}>{t.count}</td></tr>)}</tbody>
          </table>
          {k.restaurant.preorder && meals.map(([kind, label]) => {
            const list = k.dishes.filter((d) => d.dish.meal === kind);
            return list.length ? (
              <div key={kind}>
                <h3 className="print-h2">{label} — порции по предзаказу</h3>
                <table className="print-table"><tbody>{list.map((d) => <tr key={d.dish.title}><td>{d.dish.title}</td><td style={{ width: 80 }}>{d.count}</td></tr>)}</tbody></table>
              </div>
            ) : null;
          })}
        </section>
      ))}
    </Sheet>
  );
}

export type { SessionRow };
