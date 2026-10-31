"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CalendarCheck2, CheckCircle2, Minus, Plus, Search, Sparkles, Trash2, Wand2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { Frequency, Patient, Procedure, ProcedureCategory } from "@/lib/types";
import type { PlanResult } from "@/lib/scheduling/planner";
import { FREQUENCY_LABEL, plural } from "@/lib/scheduling/planner";
import { useService } from "@/hooks/useService";
import { catalogService, CATEGORY_LABEL, prescriptionsService } from "@/services";
import { dayNum, fmtDay, fmtTime, fmtWeekdayShort } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { card, CourseBar, EmptyState, Loading } from "../ui";

/** Предупреждения о противопоказаниях: аллергия гостя и особые указания процедуры */
export function cautionsFor(p: Patient, procedure: Procedure): string[] {
  const out: string[] = [];
  if (p.allergies?.includes("Йод") && procedure.id === "bath-iodine") out.push("У гостя аллергия на йод — йодобромная ванна противопоказана.");
  if (p.allergies?.includes("Новокаин") && procedure.id === "electrophoresis") out.push("У гостя аллергия на новокаин — уточните препарат для электрофореза.");
  if (procedure.caution) out.push(procedure.caution);
  return out;
}

/** Текущий курс гостя: назначено / пройдено */
export function CourseList({ patientId, canEdit, onChanged }: { patientId: string; canEdit: boolean; onChanged?: (text: string) => void }) {
  const { data } = useService(() => prescriptionsService.forPatient(patientId), [patientId]);
  const [cancel, setCancel] = useState<string | null>(null);
  if (!data) return <Loading className="h-40" />;
  if (!data.length) return <EmptyState icon={CalendarCheck2} title="Назначений пока нет" text={canEdit ? "Добавьте процедуры ниже — система сама разложит их по расписанию гостя." : "Процедуры назначает врач на приёме."} />;
  const target = data.find((c) => c.prescription.id === cancel);

  return (
    <>
      <ul className={`${card} divide-y divide-line overflow-hidden`}>
        <AnimatePresence initial={false}>
          {data.map((c) => (
            <motion.li key={c.prescription.id} layout initial={{ opacity: 0, backgroundColor: "#f1e3c4" }} animate={{ opacity: 1, backgroundColor: "rgba(0,0,0,0)" }} transition={{ duration: 1.2 }} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <span className="text-[15.5px] font-medium text-forest-deep">{c.procedure.title}</span>
                  <span className="text-[14px] tabular-nums text-ink/80">
                    <b className="text-forest-deep">{c.done}</b> из {c.total} пройдено
                  </span>
                </div>
                <CourseBar done={c.done} missed={c.missed} total={c.total} className="mt-2" />
                <div className="mt-1.5 text-[13px] text-muted">
                  {FREQUENCY_LABEL[c.prescription.frequency]} · {c.next ? `следующая ${fmtDay(c.next.date)} в ${fmtTime(c.next.start)}` : "курс завершён"}
                  {c.missed > 0 && <span className="text-danger"> · пропущено {c.missed}</span>}
                </div>
              </div>
              {canEdit && c.planned > 0 && (
                <button onClick={() => setCancel(c.prescription.id)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger" aria-label={`Отменить назначение: ${c.procedure.title}`}>
                  <Trash2 size={17} />
                </button>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <Modal open={!!target} onClose={() => setCancel(null)} title="Отменить назначение?">
        {target && (
          <>
            <p className="text-[15px] text-ink/80">
              «{target.procedure.title}»: {target.planned} {plural(target.planned, "будущий сеанс будет снят", "будущих сеанса будут сняты", "будущих сеансов будут сняты")} с расписания гостя и из очереди кабинета. Проведённые процедуры останутся в истории.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCancel(null)}>Оставить</Button>
              <Button
                className="!bg-danger hover:!bg-danger/90"
                onClick={async () => {
                  await prescriptionsService.cancel(target.prescription.id);
                  setCancel(null);
                  onChanged?.(`Назначение «${target.procedure.title}» отменено`);
                }}
              >
                Отменить назначение
              </Button>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: "daily", label: "Ежедневно" },
  { value: "every_other_day", label: "Через день" },
  { value: "twice_week", label: "2 раза в неделю" },
];

/** Добавление процедуры: выбор из каталога → система подбирает время → «Назначить» */
export function AddPrescription({ patient, onAdded }: { patient: Patient; onAdded: (text: string) => void }) {
  const [category, setCategory] = useState<ProcedureCategory | "all">("all");
  const [q, setQ] = useState("");
  const [procedureId, setProcedureId] = useState<string | null>(null);
  const [total, setTotal] = useState(7);
  const [frequency, setFrequency] = useState<Frequency>("daily");
  const [preview, setPreview] = useState<PlanResult | null>(null);
  const [busy, setBusy] = useState(false);

  const procedures = catalogService.procedures();
  const categories = useMemo(() => [...new Set(procedures.map((p) => p.category))], [procedures]);
  const list = procedures.filter((p) => (category === "all" || p.category === category) && (!q || p.title.toLowerCase().includes(q.toLowerCase())));
  const procedure = procedureId ? catalogService.procedure(procedureId) : null;
  const cautions = procedure ? cautionsFor(patient, procedure) : [];

  const pick = (id: string) => {
    setProcedureId(id);
    setPreview(null);
  };

  const plan = async () => {
    if (!procedureId) return;
    setBusy(true);
    setPreview(await prescriptionsService.preview(patient.id, procedureId, total, frequency));
    setBusy(false);
  };

  const save = async () => {
    if (!procedureId || !procedure) return;
    setBusy(true);
    const res = await prescriptionsService.add(patient.id, procedureId, total, frequency);
    setBusy(false);
    setPreview(null);
    setProcedureId(null);
    onAdded(`${procedure.title}: ${res.summary}`);
  };

  return (
    <div className={`${card} p-4 sm:p-5`}>
      <div className="flex items-center gap-2 text-[16px] font-semibold text-forest-deep">
        <Plus size={18} className="text-teal" /> Назначить процедуру
      </div>
      <p className="mt-1 text-[14px] text-muted">Выберите процедуру, количество и частоту — система сама найдёт время с учётом кабинетов, оборудования и питания гостя.</p>

      {/* каталог */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти процедуру" className="h-11 w-full rounded-full border border-line bg-white pl-10 pr-4 text-[15px] outline-none focus:border-forest/50" />
        </label>
        <select value={category} onChange={(e) => setCategory(e.target.value as ProcedureCategory | "all")} className="h-11 rounded-full border border-line bg-white px-4 text-[15px] outline-none focus:border-forest/50" aria-label="Раздел каталога">
          <option value="all">Все разделы</option>
          {categories.map((c) => (
            <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>
          ))}
        </select>
      </div>
      <div className="scrollbar-none mt-3 grid max-h-56 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-2">
        {list.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p.id)}
            className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-[14px] transition ${
              p.id === procedureId ? "border-forest bg-forest text-milk" : "border-line bg-white hover:border-forest/40"
            }`}
          >
            <span className="leading-snug">{p.title}</span>
            <span className={`shrink-0 text-[12px] ${p.id === procedureId ? "text-sage" : "text-muted"}`}>{p.durationMin} мин</span>
          </button>
        ))}
        {!list.length && <div className="col-span-full py-4 text-center text-[14px] text-muted">Ничего не нашли</div>}
      </div>

      {procedure && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-4 border-t border-line pt-5">
          <div className="text-[15px] font-medium text-forest-deep">
            {procedure.title}
            <span className="ml-2 text-[13px] font-normal text-muted">кабинет №{catalogService.medRoom(procedure.roomIds[0]).number} · {procedure.durationMin} мин</span>
          </div>
          {cautions.map((c) => (
            <div key={c} className="flex gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-[14px] text-danger">
              <AlertTriangle size={17} className="mt-0.5 shrink-0" /> {c}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="mb-1.5 text-[13px] text-muted">Количество</div>
              <div className="flex items-center gap-1 rounded-full border border-line bg-white p-1">
                <button onClick={() => { setTotal((t) => Math.max(1, t - 1)); setPreview(null); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream" aria-label="Меньше"><Minus size={16} /></button>
                <span className="w-8 text-center text-[17px] font-semibold tabular-nums">{total}</span>
                <button onClick={() => { setTotal((t) => Math.min(15, t + 1)); setPreview(null); }} className="grid h-9 w-9 place-items-center rounded-full hover:bg-cream" aria-label="Больше"><Plus size={16} /></button>
              </div>
            </div>
            <div className="min-w-0">
              <div className="mb-1.5 text-[13px] text-muted">Частота</div>
              <Segmented size="sm" value={frequency} onChange={(v) => { setFrequency(v); setPreview(null); }} options={FREQ_OPTIONS} />
            </div>
          </div>

          {!preview ? (
            <Button onClick={plan} disabled={busy} className="w-full sm:w-auto">
              <Wand2 size={17} /> Подобрать время
            </Button>
          ) : (
            <PlanPreview result={preview} onSave={save} onCancel={() => setPreview(null)} busy={busy} />
          )}
        </motion.div>
      )}
    </div>
  );
}

function PlanPreview({ result, onSave, onCancel, busy }: { result: PlanResult; onSave: () => void; onCancel: () => void; busy: boolean }) {
  const ok = result.sessions.length > 0;
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl bg-cream/70 p-4">
      <div className={`flex items-start gap-2 text-[15px] font-medium ${result.conflicts.some((c) => c.kind === "no_days" || c.kind === "stay_ends") ? "text-[#8a5a12]" : "text-ok"}`}>
        {ok && !result.conflicts.length ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : <Sparkles size={18} className="mt-0.5 shrink-0" />}
        {ok && !result.conflicts.length ? `Без конфликтов: ${result.summary}` : result.summary}
      </div>
      {result.conflicts.length > 0 && (
        <ul className="mt-2 space-y-1 text-[13.5px] text-ink/80">
          {result.conflicts.map((c) => (
            <li key={c.text} className="flex gap-2"><AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#a07a2f]" /> {c.text}</li>
          ))}
        </ul>
      )}
      {ok && (
        <div className="scrollbar-none mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {result.sessions.map((s) => (
            <div key={s.date} className="shrink-0 rounded-xl bg-milk px-3 py-2 text-center">
              <div className="text-[11px] uppercase text-muted">{fmtWeekdayShort(s.date)}</div>
              <div className="text-[15px] font-semibold text-forest-deep">{dayNum(s.date)}</div>
              <div className="text-[12px] tabular-nums text-ink/70">{fmtTime(s.start)}</div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {ok && (
          <Button onClick={onSave} disabled={busy}>
            <CalendarCheck2 size={17} /> Назначить
          </Button>
        )}
        <Button variant="ghost" onClick={onCancel}>Изменить</Button>
      </div>
    </motion.div>
  );
}
