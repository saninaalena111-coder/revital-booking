"use client";

import Link from "next/link";
import { ChevronRight, Search, UsersRound } from "lucide-react";
import { useState } from "react";
import type { PatientType } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { catalogService, patientAge, patientFullName, patientsService, PATIENT_TYPE_LABEL } from "@/services";
import { dayNum, fmtDay } from "@/lib/time";
import { Badge } from "@/components/ui/Badge";
import { Segmented } from "@/components/ui/Segmented";
import { MisTitle } from "../MisShell";

type Filter = PatientType | "all";

const TYPE_TONE: Record<PatientType, "sage" | "gold" | "outline"> = {
  guest: "sage",
  future_guest: "gold",
  outpatient: "outline",
};

/** Список гостей и пациентов с поиском по фамилии, телефону и номеру */
export function PatientsList() {
  const { sanatoriumId, sanatorium } = useSession();
  const [type, setType] = useState<Filter>("guest");
  const [q, setQ] = useState("");
  const { data } = useService(() => patientsService.list({ sanatoriumId, type, q }), [sanatoriumId, type, q]);
  const { data: counts } = useService(async () => {
    const all = await patientsService.list({ sanatoriumId });
    return { all: all.length, guest: all.filter((p) => p.type === "guest").length, future_guest: all.filter((p) => p.type === "future_guest").length, outpatient: all.filter((p) => p.type === "outpatient").length };
  }, [sanatoriumId]);

  return (
    <>
      <MisTitle
        title="Гости и пациенты"
        lead={`${sanatorium?.title ?? "Вся сеть"}: проживающие гости, будущие гости и амбулаторные пациенты. Нажмите на строку, чтобы открыть карту.`}
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={type}
          onChange={setType}
          options={[
            { value: "guest", label: `Проживают${counts ? ` · ${counts.guest}` : ""}` },
            { value: "future_guest", label: `Будущие${counts ? ` · ${counts.future_guest}` : ""}` },
            { value: "outpatient", label: `Амбулаторные${counts ? ` · ${counts.outpatient}` : ""}` },
            { value: "all", label: `Все${counts ? ` · ${counts.all}` : ""}` },
          ]}
        />
        <label className="relative block lg:w-80">
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Фамилия, телефон или номер"
            className="h-12 w-full rounded-full border border-line bg-milk pl-11 pr-4 text-[15px] outline-none placeholder:text-muted/70 focus:border-forest/50"
          />
        </label>
      </div>

      {data && !data.length && (
        <div className="rounded-3xl border border-dashed border-line bg-milk p-10 text-center">
          <UsersRound size={26} strokeWidth={1.5} className="mx-auto text-muted" />
          <div className="mt-3 text-lg font-semibold text-forest-deep">{q ? "Никого не нашли" : "Здесь пока никого нет"}</div>
          <p className="mt-1 text-[15px] text-muted">
            {q ? "Проверьте фамилию или номер телефона." : sanatorium?.kind === "spa" ? "Клиенты СПА-клуба ведутся в системе так же; в демо подробная база заведена для Геленджика." : "Выберите другой санаторий или фильтр."}
          </p>
        </div>
      )}

      {!!data?.length && (
        <div className="overflow-hidden rounded-3xl border border-line bg-milk">
          {/* таблица на планшете и ноутбуке */}
          <table className="hidden w-full text-left text-[14.5px] md:table">
            <thead className="bg-cream/60 text-[12px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Гость</th>
                <th className="px-5 py-3 font-medium">Статус</th>
                <th className="px-5 py-3 font-medium">Номер и даты</th>
                <th className="hidden px-5 py-3 font-medium xl:table-cell">Программа</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Диетстол</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.map((p) => (
                <tr key={p.id} className="group relative transition hover:bg-cream/50">
                  <td className="px-5 py-3.5">
                    <Link href={`/mis/patient?id=${p.id}`} className="font-medium text-forest-deep after:absolute after:inset-0">
                      {patientFullName(p)}
                    </Link>
                    <div className="text-[13px] text-muted">
                      {patientAge(p)} лет · {p.city}
                      {!!p.allergies?.length && <span className="text-danger"> · аллергия: {p.allergies.join(", ")}</span>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5"><Badge tone={TYPE_TONE[p.type]}>{PATIENT_TYPE_LABEL[p.type]}</Badge></td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-ink/80">
                    {p.stay ? (
                      <>
                        <span className="font-medium">№ {p.stay.roomNumber}</span>
                        <div className="text-[13px] text-muted">{dayNum(p.stay.from)} — {fmtDay(p.stay.to)}</div>
                      </>
                    ) : (
                      <span className="text-muted">Без проживания</span>
                    )}
                  </td>
                  <td className="hidden px-5 py-3.5 text-ink/80 xl:table-cell">{p.programId ? catalogService.program(p.programId).title : "—"}</td>
                  <td className="hidden px-5 py-3.5 text-ink/80 lg:table-cell">{p.dietTableId ? catalogService.dietTable(p.dietTableId).short : "—"}</td>
                  <td className="pr-4 text-muted"><ChevronRight size={18} className="transition group-hover:translate-x-0.5 group-hover:text-forest" /></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* карточки на телефоне */}
          <ul className="divide-y divide-line md:hidden">
            {data.map((p) => (
              <li key={p.id}>
                <Link href={`/mis/patient?id=${p.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-cream">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-forest-deep">{patientFullName(p)}</span>
                    <span className="block text-[13px] text-muted">
                      {p.stay ? `№ ${p.stay.roomNumber} · ${dayNum(p.stay.from)}–${fmtDay(p.stay.to)}` : PATIENT_TYPE_LABEL[p.type]}
                    </span>
                  </span>
                  <ChevronRight size={18} className="shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
