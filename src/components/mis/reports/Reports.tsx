"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, CircleAlert, Printer } from "lucide-react";
import { useState } from "react";
import { useService } from "@/hooks/useService";
import { patientFullName, reportsService, type Period } from "@/services";
import { DEMO_TODAY, fmtDay } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { MisTitle } from "../MisShell";
import { BarList } from "../charts";
import { card, Loading, Stat, StatusPill } from "../ui";

/** Отчёты главного врача: что сделано, что не сделано и кому исправить */
export function Reports() {
  const [period, setPeriod] = useState<Period>("week");
  const [all, setAll] = useState(false);
  const { data } = useService(() => reportsService.quality(period), [period]);

  return (
    <>
      <MisTitle
        title="Отчёты и качество"
        lead={`Медицинский центр Геленджика (оба санатория на Маячной) ${period === "today" ? `за ${fmtDay(DEMO_TODAY)}` : data ? `с ${fmtDay(data.from)} по ${fmtDay(DEMO_TODAY)}` : ""}: приёмы, документы, ЕГИСЗ и выполнение назначений.`}
        right={
          <Button variant="secondary" onClick={() => window.print()} className="print:hidden">
            <Printer size={16} /> Распечатать отчёт
          </Button>
        }
      />
      <Segmented className="mb-6 print:hidden" value={period} onChange={setPeriod} options={[{ value: "week", label: "За 7 дней" }, { value: "today", label: "Сегодня" }]} />

      {!data ? (
        <Loading className="h-[480px]" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="Приёмов проведено" value={data.kpi.appointments} />
            <Stat label="Документы подписаны" value={`${data.kpi.signedShare}%`} tone={data.kpi.signedShare >= 90 ? "ok" : "gold"} />
            <Stat label="Ошибки ЕГИСЗ" value={data.kpi.errors} tone={data.kpi.errors ? "danger" : "ok"} />
            <Stat label="Выполнение назначений" value={`${data.kpi.execution}%`} tone={data.kpi.execution >= 90 ? "ok" : "gold"} />
            <Stat label="Пропущено процедур" value={data.kpi.missed} tone={data.kpi.missed ? "gold" : undefined} />
          </div>

          <section className={`${card} p-5`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-[17px] font-semibold text-forest-deep">
                <CircleAlert size={19} className="text-danger" /> Требует внимания
              </h2>
              <span className="text-[13.5px] text-muted">{data.attention.length} {data.attention.length === 1 ? "случай" : "случаев"}</span>
            </div>
            {!data.attention.length ? (
              <p className="flex items-center gap-2 text-[15px] text-ok"><CheckCircle2 size={18} /> Всё в порядке — замечаний нет.</p>
            ) : (
              <ul className="divide-y divide-line">
                {(all ? data.attention : data.attention.slice(0, 8)).map((i) => (
                  <li key={i.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                    <StatusPill tone={i.severity === "high" ? "danger" : "gold"} icon={AlertTriangle} className="self-start sm:self-center">
                      {i.severity === "high" ? "Срочно" : "Сегодня"}
                    </StatusPill>
                    <div className="min-w-0 flex-1">
                      <div className="text-[15px] font-medium text-forest-deep">{i.title}</div>
                      <div className="text-[13.5px] text-muted">
                        {i.patient && <>{patientFullName(i.patient)} · </>}
                        {i.detail} · ответственный: {i.owner}
                      </div>
                    </div>
                    <Link href={i.href} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 text-[14px] font-medium text-teal hover:bg-sage-soft print:hidden">
                      Открыть <ArrowRight size={14} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {data.attention.length > 8 && (
              <button onClick={() => setAll((v) => !v)} className="mt-2 min-h-10 rounded-full px-3 text-[14px] font-medium text-teal hover:bg-sage-soft print:hidden">
                {all ? "Свернуть" : `Показать все (${data.attention.length})`}
              </button>
            )}
          </section>

          <section className={`${card} overflow-hidden`}>
            <h2 className="px-5 pb-1 pt-5 text-[17px] font-semibold text-forest-deep">По врачам</h2>
            <p className="px-5 pb-3 text-[13.5px] text-muted">Не подписано — черновики старше суток. Выполнение — проведённые сеансы назначенных врачом курсов.</p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-[14.5px]">
                <thead className="bg-cream/60 text-[12px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Врач</th>
                    <th className="px-3 py-3 text-right font-medium">Приёмы</th>
                    <th className="px-3 py-3 text-right font-medium">Протоколы</th>
                    <th className="px-3 py-3 text-right font-medium">Не подписано</th>
                    <th className="px-3 py-3 text-right font-medium">Ошибки ЕГИСЗ</th>
                    <th className="px-3 py-3 text-right font-medium">Курсов назначено</th>
                    <th className="px-3 py-3 text-right font-medium">Выполнение</th>
                    <th className="px-5 py-3 font-medium">Итог</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.doctors.map((d) => (
                    <tr key={d.doctorId}>
                      <td className="px-5 py-3">
                        <div className="font-medium text-forest-deep">{d.name}</div>
                        <div className="text-[12.5px] text-muted">{d.specialty}</div>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{d.appointments}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{d.protocols}</td>
                      <td className={`px-3 py-3 text-right tabular-nums ${d.unsigned ? "font-semibold text-[#a07a2f]" : ""}`}>{d.unsigned}</td>
                      <td className={`px-3 py-3 text-right tabular-nums ${d.errors ? "font-semibold text-danger" : ""}`}>{d.errors}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{d.courses}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{d.execution === null ? "—" : `${d.execution}%`}</td>
                      <td className="px-5 py-3">
                        {d.attention ? <StatusPill tone="gold" icon={AlertTriangle}>Требует внимания</StatusPill> : <StatusPill tone="ok" icon={CheckCircle2}>В норме</StatusPill>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {data.topProcedures.length > 0 && (
            <section className={`${card} p-5`}>
              <h2 className="text-[17px] font-semibold text-forest-deep">Чаще всего назначают</h2>
              <p className="mb-4 text-[13.5px] text-muted">Курсы, назначенные за период, — для сверки со стандартами лечения программ.</p>
              <BarList rows={data.topProcedures} format={(v) => `${v}`} />
            </section>
          )}
        </div>
      )}
    </>
  );
}
