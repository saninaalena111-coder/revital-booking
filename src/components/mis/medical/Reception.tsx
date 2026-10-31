"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowRight, Check, CheckCircle2, ClipboardList, Loader2, Search, Stethoscope, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Diagnosis, MedDocument, Patient, Visit } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { appointmentsService, catalogService, patientAge, patientFullName, patientsService, visitsService } from "@/services";
import { fmtDay, fmtTime } from "@/lib/time";
import { Button, LinkButton } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { MisTitle } from "../MisShell";
import { BackLink, card, Loading, StatusPill, useToast } from "../ui";
import { DocumentSheet } from "./DocumentPreview";
import { AddPrescription, CourseList } from "./Prescriptions";
import { templateFor, type ExamTemplate, type FieldKey } from "./templates";
import { VoiceInput } from "./VoiceInput";

/** Приём врача: открывается из «Моего дня» по записи (?appointment=) или по осмотру (?visit=) */
export function Reception() {
  const params = useSearchParams();
  const appointmentId = params.get("appointment");
  const [startedId, setStartedId] = useState<string | null>(null);
  const visitId = params.get("visit") ?? startedId;

  useEffect(() => {
    if (appointmentId) visitsService.start(appointmentId).then((v) => setStartedId(v.id));
  }, [appointmentId]);

  const { data } = useService(async () => {
    if (!visitId) return null;
    const visit = await visitsService.get(visitId);
    if (!visit) return null;
    const [patient, appointment] = await Promise.all([patientsService.get(visit.patientId), visit.appointmentId ? appointmentsService.get(visit.appointmentId) : undefined]);
    return { visit, patient: patient!, serviceId: appointment?.serviceId ?? null };
  }, [visitId]);

  if (!appointmentId && !params.get("visit")) {
    return (
      <>
        <MisTitle title="Приём врача" lead="Откройте приём из своего дня — кнопка «Начать приём» напротив пациента." />
        <LinkButton href="/mis/today">Мой день <ArrowRight size={16} /></LinkButton>
      </>
    );
  }
  if (!data) return <Loading className="h-96" />;
  // Форма создаётся заново для каждого осмотра — с его сохранёнными значениями
  return <ReceptionForm key={data.visit.id} visit={data.visit} patient={data.patient} template={templateFor(data.serviceId)} />;
}

function ReceptionForm({ visit, patient, template }: { visit: Visit; patient: Patient; template: ExamTemplate }) {
  const router = useRouter();
  const toast = useToast();
  const [form, setForm] = useState<Record<FieldKey, string>>({
    complaints: visit.complaints, anamnesis: visit.anamnesis, objective: visit.objective, recommendations: visit.recommendations,
  });
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>(visit.diagnoses);
  const [active, setActive] = useState<FieldKey>("complaints");
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [protocol, setProtocol] = useState<MedDocument | null>(null);
  const [finishing, setFinishing] = useState(false);
  const first = useRef(true);
  const refs = useRef<Partial<Record<FieldKey, HTMLTextAreaElement | null>>>({});

  // Автосохранение: врач не теряет текст при переходах
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = setTimeout(async () => {
      setSaved("saving");
      await visitsService.save(visit.id, { ...form, diagnoses });
      setSaved("saved");
    }, 600);
    return () => clearTimeout(t);
  }, [form, diagnoses, visit.id]);

  const append = (key: FieldKey, text: string) => {
    setForm((f) => ({ ...f, [key]: f[key] ? `${f[key].replace(/\s+$/, "")}${/[.!?]$/.test(f[key].trim()) ? " " : ". "}${text}` : text }));
    requestAnimationFrame(() => refs.current[key]?.focus());
  };

  const finish = async () => {
    setFinishing(true);
    await visitsService.save(visit.id, { ...form, diagnoses });
    const doc = await visitsService.finish(visit.id);
    setFinishing(false);
    setProtocol(doc);
  };

  const done = visit.status === "done";

  return (
    <>
      <BackLink href="/mis/today">Мой день</BackLink>

      {/* шапка пациента */}
      <div className={`${card} mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12.5px] font-semibold uppercase tracking-[0.16em] text-teal">
            <Stethoscope size={15} /> {template.title} · {visit.kind === "primary" ? "первичный" : "повторный"} · {fmtDay(visit.date)}, {fmtTime(visit.start)}
          </div>
          <h1 className="font-display mt-1 text-[30px] leading-tight text-forest-deep sm:text-[36px]">{patientFullName(patient)}</h1>
          <div className="mt-1 text-[14.5px] text-muted">
            {patientAge(patient)} лет
            {patient.stay && ` · номер ${patient.stay.roomNumber} · до ${fmtDay(patient.stay.to)}`}
            {patient.programId && ` · ${catalogService.program(patient.programId).title}`}
            {patient.dietTableId && ` · ${catalogService.dietTable(patient.dietTableId).title}`}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {patient.allergies?.length ? (
              <StatusPill tone="danger" icon={AlertTriangle}>Аллергия: {patient.allergies.join(", ")}</StatusPill>
            ) : (
              <StatusPill tone="muted">Аллергий нет</StatusPill>
            )}
            {patient.chronic?.map((c) => <StatusPill key={c} tone="muted">{c}</StatusPill>)}
          </div>
        </div>
        <LinkButton href={`/mis/patient?id=${patient.id}`} variant="secondary" size="sm" className="shrink-0">
          <ClipboardList size={15} /> Карта гостя
        </LinkButton>
      </div>

      {done && (
        <div className="mb-5 flex items-center gap-2 rounded-2xl bg-ok-soft px-4 py-3 text-[14.5px] text-ok">
          <CheckCircle2 size={18} /> Приём завершён, протокол в документах гостя. Изменения сохраняются автоматически.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 space-y-4">
          {/* на телефоне голосовой ввод — над полями */}
          <div className="lg:hidden">
            <VoiceInput fieldLabel={template.fields[active].label} sample={template.fields[active].sample} onText={(t) => append(active, t)} />
          </div>

          {(["complaints", "anamnesis", "objective"] as const).map((key) => (
            <Field key={key} k={key} t={template.fields[key]} value={form[key]} active={active === key}
              onFocus={() => setActive(key)} onChange={(v) => setForm((f) => ({ ...f, [key]: v }))}
              onPhrase={(p) => append(key, p)} inputRef={(el) => { refs.current[key] = el; }} />
          ))}

          <DiagnosisPicker value={diagnoses} onChange={setDiagnoses} frequent={template.frequentDiagnoses} />

          <Field k="recommendations" t={template.fields.recommendations} value={form.recommendations} active={active === "recommendations"}
            onFocus={() => setActive("recommendations")} onChange={(v) => setForm((f) => ({ ...f, recommendations: v }))}
            onPhrase={(p) => append("recommendations", p)} inputRef={(el) => { refs.current.recommendations = el; }} />

          <div className="lg:hidden">
            <PrescribeBlock patient={patient} onDone={toast.show} />
          </div>

          {/* нижняя панель действий: на телефоне — над плавающими кнопками */}
          <div className="sticky bottom-[72px] z-20 flex items-center justify-between gap-3 rounded-3xl border border-line bg-milk/95 p-2.5 pl-4 shadow-[var(--shadow-lift)] backdrop-blur sm:bottom-3 sm:p-4">
            <span className="flex min-w-0 items-center gap-2 text-[13px] text-muted">
              {saved === "saving" ? <Loader2 size={15} className="shrink-0 animate-spin" /> : <Check size={15} className="shrink-0 text-ok" />}
              <span className="truncate">
                {!done && !diagnoses.length ? "Добавьте диагноз, чтобы завершить" : saved === "saving" ? "Сохраняем…" : saved === "saved" ? "Изменения сохранены" : "Сохраняется автоматически"}
              </span>
            </span>
            {!done && (
              <Button onClick={finish} disabled={finishing || !diagnoses.length} className="shrink-0 sm:h-14 sm:px-8">
                {finishing ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />} Завершить приём
              </Button>
            )}
          </div>
        </div>

        {/* голосовой ввод остаётся на экране при прокрутке, назначения проезжают под ним */}
        <aside className="hidden space-y-4 lg:block">
          <div className="sticky top-20 z-10">
            <VoiceInput fieldLabel={template.fields[active].label} sample={template.fields[active].sample} onText={(t) => append(active, t)} />
          </div>
          <PrescribeBlock patient={patient} onDone={toast.show} />
        </aside>
      </div>

      <Modal open={!!protocol} onClose={() => router.push("/mis/today")} wide title="Приём завершён">
        {protocol && (
          <>
            <p className="-mt-2 mb-4 text-[15px] text-muted">Протокол сохранён черновиком. Подпишите его и отправьте в ЕГИСЗ — в разделе «ЕГИСЗ и документы».</p>
            <DocumentSheet doc={protocol} patient={patient} />
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <LinkButton href={`/mis/patient?id=${patient.id}&tab=documents`} variant="ghost">Карта гостя</LinkButton>
              <LinkButton href="/mis/egisz" variant="secondary">Подписать документ</LinkButton>
              <LinkButton href="/mis/today">К следующему пациенту <ArrowRight size={16} /></LinkButton>
            </div>
          </>
        )}
      </Modal>
      {toast.node}
    </>
  );
}

function PrescribeBlock({ patient, onDone }: { patient: Patient; onDone: (t: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-semibold text-forest-deep">Назначения</h2>
        <Link href={`/mis/patient?id=${patient.id}&tab=schedule`} className="text-[13.5px] text-teal hover:underline">Расписание гостя</Link>
      </div>
      <CourseList patientId={patient.id} canEdit onChanged={onDone} />
      {patient.stay ? (
        <AddPrescription patient={patient} onAdded={onDone} />
      ) : (
        <p className="rounded-2xl bg-cream p-4 text-[14px] text-muted">Пациент без проживания: процедуры назначаются через онлайн-запись.</p>
      )}
    </div>
  );
}

function Field({
  k, t, value, active, onFocus, onChange, onPhrase, inputRef,
}: {
  k: FieldKey;
  t: ExamTemplate["fields"][FieldKey];
  value: string;
  active: boolean;
  onFocus: () => void;
  onChange: (v: string) => void;
  onPhrase: (p: string) => void;
  inputRef: (el: HTMLTextAreaElement | null) => void;
}) {
  return (
    <div className={`${card} p-4 transition sm:p-5 ${active ? "border-forest/50 ring-2 ring-forest/10" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`f-${k}`} className="text-[15px] font-semibold text-forest-deep">{t.label}</label>
        {active && <span className="text-[12px] font-medium text-teal">голос пишет сюда</span>}
      </div>
      <textarea
        id={`f-${k}`}
        ref={inputRef}
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.placeholder}
        rows={3}
        className="mt-2 w-full resize-y rounded-2xl border border-line bg-white px-4 py-3 text-[15px] leading-relaxed outline-none focus:border-forest/50"
      />
      <div className="mt-2 flex flex-wrap gap-1.5">
        {t.phrases.map((p) => (
          <button key={p} type="button" onClick={() => { onFocus(); onPhrase(p); }} className="min-h-8 rounded-full border border-line bg-cream/60 px-3 text-[13px] text-ink/80 hover:border-forest/40 hover:text-forest">
            + {p}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Диагноз по МКБ-10: поиск по коду или словам и частые диагнозы специальности */
function DiagnosisPicker({ value, onChange, frequent }: { value: Diagnosis[]; onChange: (d: Diagnosis[]) => void; frequent: string[] }) {
  const [q, setQ] = useState("");
  const results = catalogService.icdSearch(q).filter((d) => !value.some((x) => x.code === d.code));
  const add = (d: Diagnosis) => {
    onChange([...value, d]);
    setQ("");
  };
  const frequentList = frequent.flatMap((c) => catalogService.icdSearch(c, 1)).filter((d) => !value.some((x) => x.code === d.code));

  return (
    <div className={`${card} p-4 sm:p-5`}>
      <label htmlFor="icd" className="text-[15px] font-semibold text-forest-deep">Диагноз по МКБ-10</label>
      {value.length > 0 && (
        <ul className="mt-3 space-y-2">
          {value.map((d, i) => (
            <li key={d.code} className="flex items-center gap-3 rounded-2xl bg-sage-soft/70 px-4 py-2.5">
              <span className="rounded-lg bg-forest px-2 py-0.5 text-[13px] font-semibold text-milk">{d.code}</span>
              <span className="min-w-0 flex-1 text-[14.5px] text-forest-deep">
                {d.title}
                {i === 0 && <span className="ml-2 text-[12px] text-muted">основной</span>}
              </span>
              <button onClick={() => onChange(value.filter((x) => x.code !== d.code))} className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-milk hover:text-danger" aria-label={`Убрать диагноз ${d.code}`}>
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative mt-3">
        <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input
          id="icd"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Код или слова: «M54», «боль спина», «бессонница»"
          autoComplete="off"
          className="h-12 w-full rounded-2xl border border-line bg-white pl-10 pr-4 text-[15px] outline-none focus:border-forest/50"
        />
        {q && (
          <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-line bg-milk p-1.5 shadow-[var(--shadow-lift)]">
            {results.length ? (
              results.map((d) => (
                <li key={d.code}>
                  <button onClick={() => add(d)} className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-cream">
                    <span className="w-14 shrink-0 font-semibold text-forest">{d.code}</span>
                    <span className="text-[14.5px] text-ink/85">{d.title}</span>
                  </button>
                </li>
              ))
            ) : (
              <li className="px-3 py-3 text-[14px] text-muted">Ничего не нашли. В рабочей версии — полный справочник МКБ-10 из НСИ Минздрава.</li>
            )}
          </ul>
        )}
      </div>
      {frequentList.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] text-muted">Часто:</span>
          {frequentList.map((d) => (
            <button key={d.code} onClick={() => add(d)} className="min-h-8 rounded-full border border-line bg-cream/60 px-3 text-[13px] text-ink/80 hover:border-forest/40" title={d.title}>
              {d.code} · {d.title.length > 28 ? `${d.title.slice(0, 28)}…` : d.title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
