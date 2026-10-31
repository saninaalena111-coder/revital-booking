"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CheckCircle2, FileSignature, Loader2, PenLine, Send, Wrench } from "lucide-react";
import { useState } from "react";
import type { DocStatus, MedDocument } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { documentsService, patientFullName, patientsService, type DocRow } from "@/services";
import { fmtDay } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";
import { MisTitle } from "../MisShell";
import { DocumentModal } from "../medical/DocumentPreview";
import { card, DocStatusPill, EmptyState, Loading, useToast } from "../ui";
import { SignModal } from "./SignModal";

type Filter = DocStatus | "all";

/** ЕГИСЗ и документы: статусы, подпись, отправка через N3.Health и исправление ошибок */
export function Egisz() {
  const { role, user, sanatoriumId } = useSession();
  const isDoctor = role?.id === "doctor";
  const [onlyMine, setOnlyMine] = useState(isDoctor);
  const [filter, setFilter] = useState<Filter>("all");
  const [preview, setPreview] = useState<DocRow | null>(null);
  const [sign, setSign] = useState<MedDocument | null>(null);
  const [fix, setFix] = useState<DocRow | null>(null);
  const toast = useToast();
  const doctorId = onlyMine && user?.doctorId ? user.doctorId : undefined;
  const { data } = useService(() => documentsService.list({ sanatoriumId, doctorId }), [sanatoriumId, doctorId]);

  const count = (s: DocStatus) => data?.filter((r) => r.doc.status === s).length ?? 0;
  const rows = data?.filter((r) => filter === "all" || r.doc.status === filter) ?? [];

  return (
    <>
      <MisTitle
        title="ЕГИСЗ и документы"
        lead="Врач подписывает документ электронной подписью, система отправляет его в государственную систему ЕГИСЗ через сервис N3.Health и показывает ответ."
      />

      <ChainDiagram />

      {/* путь документа */}
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(["draft", "signed", "sent", "registered", "error"] as DocStatus[]).map((s, i) => (
          <button key={s} onClick={() => setFilter(filter === s ? "all" : s)} className={`${card} flex items-center justify-between gap-2 px-4 py-3 text-left transition ${filter === s ? "border-forest ring-2 ring-forest/15" : "hover:border-forest/40"}`}>
            <span>
              <span className="block text-[12px] text-muted">{s === "error" ? "Нужна правка" : `Шаг ${i + 1}`}</span>
              <DocStatusPill status={s} />
            </span>
            <span className={`font-display text-[28px] ${s === "error" && count(s) ? "text-danger" : "text-forest-deep"}`}>{count(s)}</span>
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `Все · ${data?.length ?? 0}` },
            { value: "draft", label: "Ждут подписи" },
            { value: "error", label: "С ошибкой" },
          ]}
        />
        {isDoctor && (
          <label className="flex cursor-pointer items-center gap-3 text-[14px] text-ink/80">
            Только мои документы <Toggle checked={onlyMine} onChange={setOnlyMine} label="Только мои документы" />
          </label>
        )}
      </div>

      {!data ? (
        <Loading />
      ) : !rows.length ? (
        <EmptyState icon={CheckCircle2} title="Документов в этом статусе нет" text="Выберите другой статус или покажите все документы." />
      ) : (
        <ul className={`${card} divide-y divide-line overflow-hidden`}>
          {rows.map((r) => (
            <motion.li key={r.doc.id} layout className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5">
              <button onClick={() => setPreview(r)} className="min-w-0 flex-1 text-left">
                <span className="block text-[15.5px] font-medium text-forest-deep hover:underline">{r.doc.title}</span>
                <span className="block text-[13.5px] text-muted">
                  {patientFullName(r.patient)} · {fmtDay(r.doc.date)} · {r.doctor}
                  {r.doc.remdId && ` · ${r.doc.remdId}`}
                </span>
                {r.doc.errorText && (
                  <span className="mt-1.5 flex gap-1.5 text-[13.5px] text-danger">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" /> {r.doc.errorText}
                  </span>
                )}
              </button>
              <DocStatusPill status={r.doc.status} />
              <div className="shrink-0 sm:w-48 sm:text-right">
                <RowAction row={r} onSign={() => setSign(r.doc)} onFix={() => setFix(r)} onDone={toast.show} />
              </div>
            </motion.li>
          ))}
        </ul>
      )}

      <DocumentModal doc={preview?.doc ?? null} patient={preview?.patient} onClose={() => setPreview(null)} />
      <SignModal doc={sign} onClose={() => setSign(null)} onSigned={toast.show} />
      <FixModal row={fix} onClose={() => setFix(null)} onDone={toast.show} />
      {toast.node}
    </>
  );
}

function RowAction({ row, onSign, onFix, onDone }: { row: DocRow; onSign: () => void; onFix: () => void; onDone: (t: string) => void }) {
  const [busy, setBusy] = useState(false);
  const { role } = useSession();
  const canSign = role?.id === "doctor";
  switch (row.doc.status) {
    case "draft":
      return canSign ? (
        <Button size="sm" onClick={onSign} className="w-full sm:w-auto"><PenLine size={15} /> Подписать</Button>
      ) : <span className="text-[13px] text-muted">Ждёт подписи врача</span>;
    case "signed":
      return (
        <Button size="sm" variant="secondary" disabled={busy} className="w-full sm:w-auto" onClick={async () => {
          setBusy(true);
          await documentsService.send(row.doc.id);
          onDone("Отправлено в ЕГИСЗ — ждём ответа от РЭМД");
        }}>
          {busy ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Отправить в ЕГИСЗ
        </Button>
      );
    case "sent":
      return <span className="inline-flex items-center gap-1.5 text-[13px] text-muted"><Loader2 size={14} className="animate-spin" /> Ждём ответа РЭМД</span>;
    case "registered":
      return <span className="inline-flex items-center gap-1.5 text-[13px] text-ok"><CheckCircle2 size={15} /> Готово</span>;
    case "error":
      return <Button size="sm" variant="gold" onClick={onFix} className="w-full sm:w-auto"><Wrench size={15} /> Исправить</Button>;
  }
}

/** Исправление ошибки РЭМД: объясняем причину и даём исправить в одном окне */
function FixModal({ row, onClose, onDone }: { row: DocRow | null; onClose: () => void; onDone: (t: string) => void }) {
  const [snils, setSnils] = useState("");
  const [busy, setBusy] = useState(false);
  const snilsError = row?.doc.errorText?.includes("СНИЛС");
  const valid = !snilsError || /^\d{3}-\d{3}-\d{3} \d{2}$/.test(snils);

  const save = async () => {
    if (!row) return;
    setBusy(true);
    if (snilsError) await patientsService.update(row.patient.id, { snils });
    await documentsService.fix(row.doc.id);
    await documentsService.send(row.doc.id);
    setBusy(false);
    setSnils("");
    onDone("Исправлено и отправлено повторно");
    onClose();
  };

  const format = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 11);
    return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 9)].filter(Boolean).join("-") + (d.length > 9 ? ` ${d.slice(9)}` : "");
  };

  return (
    <Modal open={!!row} onClose={onClose} title="Исправить и отправить снова">
      {row && (
        <>
          <div className="flex gap-2 rounded-2xl bg-danger-soft p-4 text-[14.5px] text-danger">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" /> {row.doc.errorText}
          </div>
          <p className="mt-4 text-[15px] text-ink/80">
            {row.doc.title} · {patientFullName(row.patient)}
          </p>
          {snilsError ? (
            <label className="mt-4 block">
              <span className="text-[14px] font-medium text-forest-deep">СНИЛС гостя</span>
              <input
                value={snils}
                onChange={(e) => setSnils(format(e.target.value))}
                placeholder="000-000-000 00"
                inputMode="numeric"
                className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-white px-4 text-[16px] tracking-wide outline-none focus:border-forest/50"
              />
              <span className="mt-1 block text-[12.5px] text-muted">Демо: введите любые 11 цифр. СНИЛС сохранится в карте гостя.</span>
            </label>
          ) : (
            <div className="mt-4 rounded-2xl bg-cream p-4 text-[14.5px]">
              Система проверила диагноз по актуальному справочнику МКБ-10 и обновила код. Проверьте документ и отправьте снова.
            </div>
          )}
          <div className="mt-6 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>Отмена</Button>
            <Button onClick={save} disabled={!valid || busy}>
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Сохранить и отправить
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}

/** Простая схема: МИС Ревиталь → N3.Health → ЕГИСЗ */
function ChainDiagram() {
  const steps = [
    { title: "МИС Ревиталь", sub: "Врач подписывает документ", icon: FileSignature },
    { title: "N3.Health", sub: "Проверяет и передаёт", icon: Send },
    { title: "ЕГИСЗ · РЭМД", sub: "Регистрирует документ", icon: CheckCircle2 },
  ];
  return (
    <div className={`${card} mb-6 p-5 sm:p-6`}>
      <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
        {steps.map((s, i) => (
          <div key={s.title} className="contents">
            <div className={`flex flex-1 items-center gap-3 rounded-2xl p-4 ${i === 0 ? "bg-forest-deep text-milk" : i === 1 ? "bg-sage-soft text-forest-deep" : "bg-ok-soft text-forest-deep"}`}>
              <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${i === 0 ? "bg-milk/10" : "bg-milk"}`}>
                <s.icon size={20} strokeWidth={1.6} />
              </span>
              <span>
                <span className="block text-[16px] font-semibold">{s.title}</span>
                <span className={`block text-[13px] ${i === 0 ? "text-sage" : "text-muted"}`}>{s.sub}</span>
              </span>
            </div>
            {i < steps.length - 1 && (
              <svg viewBox="0 0 60 24" className="mx-auto h-6 w-12 shrink-0 rotate-90 text-teal md:rotate-0" aria-hidden>
                <path d="M2 12h50" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4">
                  <animate attributeName="stroke-dashoffset" from="16" to="0" dur="1s" repeatCount="indefinite" />
                </path>
                <path d="M46 5l9 7-9 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-2 text-[13px] text-muted">
        <ArrowRight size={14} className="shrink-0" /> Демо: реальной отправки нет — статусы меняются, как в рабочей системе.
      </p>
    </div>
  );
}
