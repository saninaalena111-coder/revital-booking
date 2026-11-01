"use client";

import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { analyticsService } from "@/services";
import { MisTitle } from "../MisShell";
import { ComingSoonButton } from "../ComingSoon";
import { BarList, LineChart, SERIES_COLORS } from "../charts";
import { card, Loading, Stat } from "../ui";

const mln = (n: number) => `${(n / 1_000_000).toFixed(1).replace(".", ",")} млн ₽`;

/** Сводная панель руководителя: вся сеть или один санаторий — по переключателю в шапке */
export function Analytics() {
  const { sanatoriumId, sanatorium, tenant } = useSession();
  const { data } = useService(() => analyticsService.network(sanatoriumId), [sanatoriumId]);
  // Цвет закреплён за объектом: санатории — проверенная палитра, СПА-клубы — спокойные нейтральные тона
  const colorOf = (id: string) => SERIES_COLORS[tenant.sanatoriums.findIndex((s) => s.id === id)] ?? (id === "spa-moscow" ? "#7d8a96" : "#a3a99f");

  return (
    <>
      <MisTitle
        title="Сводная панель"
        lead={`${sanatorium?.title ?? `Вся сеть «${tenant.brand.name}»`}: загрузка номеров, выручка, записи и процедуры. Санаторий выбирается в шапке. Цифры демонстрационные.`}
        right={<ComingSoonButton feature="export" variant="secondary"><Download size={16} /> Выгрузить отчёт</ComingSoonButton>}
      />
      {!data ? (
        <Loading className="h-[520px]" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <Stat label="Загрузка сегодня" value={`${data.kpi.occupancyToday}%`} />
            <Stat label="Гостей проживает" value={data.kpi.living} />
            <Stat label="Выручка за 30 дней" value={mln(data.kpi.revenue30)} tone="ok" />
            <Stat label="Записи к врачам сегодня" value={data.kpi.appointmentsToday || "—"} />
            <Stat label="Процедуры сегодня" value={data.kpi.proceduresTotal ? `${data.kpi.proceduresDone} из ${data.kpi.proceduresTotal}` : "—"} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <section className={`${card} p-5`}>
              <h2 className="text-[17px] font-semibold text-forest-deep">Загрузка номеров на 30 дней вперёд</h2>
              <p className="mb-3 text-[13.5px] text-muted">Доля занятых номеров по дням. Наведите на график, чтобы увидеть точные значения.</p>
              {data.forecast.series.length > 1 && (
                <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink/80">
                  {data.forecast.series.map((s) => (
                    <span key={s.id} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(s.id) }} /> {s.title}</span>
                  ))}
                </div>
              )}
              <LineChart
                dates={data.forecast.dates}
                series={data.forecast.series.map((s) => ({ ...s, color: data.forecast.series.length > 1 ? colorOf(s.id) : "var(--color-forest)" }))}
              />
            </section>
            <section className={`${card} p-5`}>
              <h2 className="text-[17px] font-semibold text-forest-deep">Выручка за 30 дней</h2>
              <p className="mb-4 text-[13.5px] text-muted">Путёвки (цены номеров с сайта + лечение) и процедуры СПА-клубов, демо-расчёт.</p>
              <BarList rows={data.sanatoriums.map((s) => ({ label: s.short, value: s.revenue30, color: colorOf(s.id) }))} format={mln} />
              <h3 className="mb-3 mt-6 text-[15px] font-semibold text-forest-deep">Откуда приходят гости</h3>
              <BarList rows={data.sources.slice(0, 6)} format={(v) => `${v} броней`} color="var(--color-teal)" />
              <Link href="/mis/sources" className="mt-3 inline-flex items-center gap-1 text-[13.5px] text-teal hover:underline">Подробно по рекламе и меткам <ArrowRight size={14} /></Link>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className={`${card} p-5`}>
              <h2 className="text-[17px] font-semibold text-forest-deep">Популярные процедуры</h2>
              <p className="mb-4 text-[13.5px] text-muted">Выполнено за последние 14 дней{sanatoriumId === "all" ? " · Геленджик" : ""}.</p>
              {data.topProcedures.length ? <BarList rows={data.topProcedures} format={(v) => `${v}`} /> : <p className="text-[14px] text-muted">Для этого объекта процедуры ещё не ведутся в системе.</p>}
            </section>
            <section className={`${card} p-5`}>
              <h2 className="text-[17px] font-semibold text-forest-deep">Нагрузка врачей сегодня</h2>
              <p className="mb-4 text-[13.5px] text-muted">Занятое время от рабочей смены{sanatoriumId === "all" ? " · Геленджик" : ""}.</p>
              {data.doctorsLoad.length ? (
                <BarList rows={data.doctorsLoad.map((d) => ({ label: d.label, sub: `${d.sub} · ${d.visits} приём.`, value: d.percent }))} format={(v) => `${v}%`} max={100} />
              ) : (
                <p className="text-[14px] text-muted">Расписание врачей этого объекта подключается так же, как в Геленджике.</p>
              )}
            </section>
          </div>

          <section className={`${card} overflow-hidden`}>
            <h2 className="px-5 pb-2 pt-5 text-[17px] font-semibold text-forest-deep">По санаториям</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[14.5px]">
                <thead className="bg-cream/60 text-[12px] uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-5 py-3 font-medium">Санаторий</th>
                    <th className="px-5 py-3 text-right font-medium">Номеров</th>
                    <th className="px-5 py-3 text-right font-medium">Проживают</th>
                    <th className="px-5 py-3 text-right font-medium">Загрузка сегодня</th>
                    <th className="px-5 py-3 text-right font-medium">Средняя на 30 дней</th>
                    <th className="px-5 py-3 text-right font-medium">Выручка за 30 дней</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {data.sanatoriums.map((s) => (
                    <tr key={s.id}>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 font-medium text-forest-deep"><i className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(s.id) }} />{s.title}</span>
                        {s.kind === "spa" && <span className="text-[12.5px] text-muted">без проживания · {s.visits30?.toLocaleString("ru-RU")} посещений за 30 дней</span>}
                      </td>
                      <td className="px-5 py-3 text-right tabular-nums">{s.kind === "spa" ? "—" : s.rooms}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{s.kind === "spa" ? "—" : s.living}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{s.kind === "spa" ? "—" : `${s.occupancyToday}%`}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{s.kind === "spa" ? "—" : `${s.occupancy30}%`}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{mln(s.revenue30)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
