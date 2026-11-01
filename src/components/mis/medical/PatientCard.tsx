"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, BedDouble, CalendarDays, FileText, FlaskConical, Phone, PlayCircle, ScrollText, Stethoscope, UserRound, Utensils } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { Appointment, MedDocument, Patient } from "@/lib/types";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import {
  appointmentsService, auditService, catalogService, doctorsService, documentsService, labsService, patientAge, patientFullName,
  patientsService, PATIENT_TYPE_LABEL, prescriptionsService, proceduresService, visitsService,
} from "@/services";
import { DEMO_TODAY, dayNum, fmtDay, fmtRange, fmtTime, fmtWeekdayLong, relativeDay } from "@/lib/time";
import { Button, LinkButton } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { BackLink, card, DocStatusPill, EmptyState, Loading, SessionStatusPill, StatusPill, useToast } from "../ui";
import { DocumentModal } from "./DocumentPreview";
import { AddPrescription, CourseList } from "./Prescriptions";
import { SignModal } from "../egisz/SignModal";
import { PrintButton, PrintCard, PrintPrescriptions, PrintSchedule } from "../print/Print";

type Tab = "visits" | "prescriptions" | "schedule" | "documents" | "labs";
const TABS: { value: Tab; label: string }[] = [
  { value: "visits", label: "Приёмы" },
  { value: "prescriptions", label: "Назначения" },
  { value: "schedule", label: "Расписание" },
  { value: "documents", label: "Документы" },
  { value: "labs", label: "Анализы" },
];

/** Карта гостя: шапка с главным и вкладки по медицинским данным */
export function PatientCard() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "p-anna";
  const tab = (TABS.find((t) => t.value === params.get("tab"))?.value ?? "visits") as Tab;
  const setTab = (t: Tab) => router.replace(`/mis/patient?id=${id}&tab=${t}`, { scroll: false });
  const { data: patient, loading } = useService(() => patientsService.get(id), [id]);
  const logged = useRef<string | null>(null);

  // Каждое открытие карты попадает в журнал действий
  useEffect(() => {
    if (patient && logged.current !== patient.id) {
      logged.current = patient.id;
      auditService.log("view", "Открыта карта гостя", patient.id);
    }
  }, [patient]);

  if (!patient && loading) return <Loading className="h-96" />;
  if (!patient) return <EmptyState title="Карта не найдена" text="Возможно, ссылка устарела. Найдите гостя в списке." action={<LinkButton href="/mis/patients">К списку гостей</LinkButton>} />;

  return (
    <>
      <BackLink href="/mis/patients">Гости и пациенты</BackLink>
      <PatientHeader patient={patient} />
      <Segmented className="mb-6 mt-6" value={tab} onChange={setTab} options={TABS} />
      {tab === "visits" && <VisitsTab patient={patient} />}
      {tab === "prescriptions" && <PrescriptionsTab patient={patient} />}
      {tab === "schedule" && <ScheduleTab patient={patient} />}
      {tab === "documents" && <DocumentsTab patient={patient} />}
      {tab === "labs" && <LabsTab patient={patient} />}
    </>
  );
}

function PatientHeader({ patient }: { patient: Patient }) {
  const { role, user } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [doc, setDoc] = useState<MedDocument | null>(null);
  const [signing, setSigning] = useState<MedDocument | null>(null);
  const isDoctor = role?.id === "doctor";
  const { data: todayVisit } = useService(async () => {
    if (!user?.doctorId) return undefined;
    const day = await visitsService.doctorDay(user.doctorId, DEMO_TODAY);
    return day.find((d) => d.patient?.id === patient.id && d.status !== "done");
  }, [patient.id, user?.doctorId]);

  const discharge = async () => {
    setBusy(true);
    const d = await documentsService.createDischarge(patient.id, user?.doctorId ?? "orlova");
    setBusy(false);
    setDoc(d);
    toast.show("Выписной эпикриз сформирован");
  };

  const facts = [
    patient.stay && { icon: BedDouble, label: "Номер и даты", value: `№ ${patient.stay.roomNumber} · ${dayNum(patient.stay.from)} — ${fmtDay(patient.stay.to)}` },
    patient.programId && { icon: ScrollText, label: "Программа", value: catalogService.program(patient.programId).title },
    patient.dietTableId && { icon: Utensils, label: "Диетстол", value: catalogService.dietTable(patient.dietTableId).title },
    { icon: Phone, label: "Телефон", value: patient.phone },
  ].filter(Boolean) as { icon: typeof BedDouble; label: string; value: string }[];

  return (
    <div className={`${card} p-5 sm:p-6`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="hidden h-16 w-16 shrink-0 place-items-center rounded-full bg-sage-soft text-xl font-semibold text-forest sm:grid">
            {patient.lastName[0]}{patient.firstName[0]}
          </span>
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-teal">{PATIENT_TYPE_LABEL[patient.type]}</div>
            <h1 className="font-display text-[32px] leading-tight text-forest-deep sm:text-[40px]">{patientFullName(patient)}</h1>
            <div className="mt-1 text-[15px] text-muted">
              {patientAge(patient)} лет · {patient.sex === "f" ? "женщина" : "мужчина"} · {patient.city} · карта {patient.misId}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {patient.allergies?.length ? (
                <StatusPill tone="danger" icon={AlertTriangle} className="!text-[13.5px]">Аллергия: {patient.allergies.join(", ")}</StatusPill>
              ) : (
                <StatusPill tone="muted">Аллергий нет</StatusPill>
              )}
              {patient.chronic?.map((c) => <StatusPill key={c} tone="muted">{c}</StatusPill>)}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:flex-col lg:items-stretch">
          {isDoctor && todayVisit && (
            <Button onClick={() => router.push(`/mis/reception?appointment=${todayVisit.appointment.id}`)}>
              <PlayCircle size={17} /> {todayVisit.status === "in_progress" ? "Продолжить приём" : "Начать приём"}
            </Button>
          )}
          {isDoctor && (
            <Button variant="secondary" onClick={discharge} disabled={busy}>
              <FileText size={16} /> Сформировать выписку
            </Button>
          )}
          <PrintButton
            label="Распечатать карту"
            make={async () => {
              const [course, visits, docs] = await Promise.all([prescriptionsService.forPatient(patient.id), visitsService.forPatient(patient.id), documentsService.forPatient(patient.id)]);
              return <PrintCard patient={patient} course={course} visits={visits} docs={docs} />;
            }}
          />
          {patient.id === "p-anna" && (
            <LinkButton href="/cabinet" variant="ghost">
              <UserRound size={16} /> Глазами гостя
            </LinkButton>
          )}
        </div>
      </div>
      <dl className="mt-5 grid gap-3 border-t border-line pt-5 sm:grid-cols-2 xl:grid-cols-4">
        {facts.map((f) => (
          <div key={f.label} className="flex gap-3">
            <f.icon size={18} strokeWidth={1.6} className="mt-0.5 shrink-0 text-teal" />
            <div className="min-w-0">
              <dt className="text-[12.5px] text-muted">{f.label}</dt>
              <dd className="text-[14.5px] font-medium text-forest-deep">{f.value}</dd>
            </div>
          </div>
        ))}
      </dl>
      <DocumentModal doc={doc} patient={patient} onClose={() => setDoc(null)}
        actions={<Button onClick={() => { setSigning(doc); setDoc(null); }}>Подписать</Button>} />
      <SignModal doc={signing} onClose={() => setSigning(null)} onSigned={toast.show} />
      {toast.node}
    </div>
  );
}

/* ---------------- Приёмы ---------------- */

function VisitsTab({ patient }: { patient: Patient }) {
  const { data } = useService(async () => {
    const [visits, appointments, doctors, services] = await Promise.all([
      visitsService.forPatient(patient.id), appointmentsService.forPatient(patient.id), doctorsService.list(), doctorsService.services(),
    ]);
    return { visits, appointments, doctors, services };
  }, [patient.id]);
  const [open, setOpen] = useState<string | null>(null);
  if (!data) return <Loading />;
  const upcoming = data.appointments.filter((a) => a.date >= DEMO_TODAY && a.status === "confirmed" && !data.visits.some((v) => v.appointmentId === a.id));
  const svc = (a: Appointment) => data.services.find((s) => s.id === a.serviceId)?.title ?? "Приём";

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <div className="min-w-0 space-y-3">
        <h2 className="text-[17px] font-semibold text-forest-deep">Проведённые приёмы</h2>
        {!data.visits.length && <EmptyState icon={Stethoscope} title="Приёмов ещё не было" text="Первичный приём терапевта проводится в день заезда или на следующий день." />}
        {data.visits.map((v) => (
          <div key={v.id} className={`${card} overflow-hidden`}>
            <button onClick={() => setOpen(open === v.id ? null : v.id)} className="flex w-full items-center gap-4 p-4 text-left hover:bg-cream/40 sm:p-5">
              <div className="w-14 shrink-0 text-center">
                <div className="font-display text-[28px] leading-none text-forest-deep">{dayNum(v.date)}</div>
                <div className="text-[12px] text-muted">{fmtTime(v.start)}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15.5px] font-medium text-forest-deep">{v.kind === "primary" ? "Первичный приём" : v.kind === "repeat" ? "Повторный приём" : "Заключительный приём"}</div>
                <div className="text-[13.5px] text-muted">{visitsService.doctorName(v.doctorId)} · {v.diagnoses.map((d) => d.code).join(", ") || "диагноз не указан"}</div>
              </div>
              <StatusPill tone={v.status === "done" ? "ok" : "gold"}>{v.status === "done" ? "Завершён" : "Идёт приём"}</StatusPill>
            </button>
            {open === v.id && (
              <dl className="space-y-3 border-t border-line bg-white/60 p-5 text-[14.5px]">
                {[["Жалобы", v.complaints], ["Анамнез", v.anamnesis], ["Объективно", v.objective], ["Диагноз", v.diagnoses.map((d) => `${d.code} — ${d.title}`).join("; ")], ["Рекомендации", v.recommendations]].map(([h, t]) => (
                  <div key={h}>
                    <dt className="text-[12px] font-semibold uppercase tracking-[0.12em] text-teal">{h}</dt>
                    <dd className="mt-0.5 text-ink/85">{t || "—"}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <h2 className="text-[17px] font-semibold text-forest-deep">Предстоящие записи</h2>
        {!upcoming.length ? (
          <p className={`${card} p-5 text-[14px] text-muted`}>Записей к врачам нет.</p>
        ) : (
          <ul className={`${card} divide-y divide-line`}>
            {upcoming.map((a) => {
              const d = data.doctors.find((x) => x.id === a.doctorId)!;
              return (
                <li key={a.id} className="p-4">
                  <div className="text-[14.5px] font-medium text-forest-deep">{relativeDay(a.date)}, {fmtTime(a.start)}</div>
                  <div className="text-[13.5px] text-muted">{svc(a)} · {d.lastName} {d.firstName[0]}. {d.patronymic[0]}.</div>
                  {a.createdVia === "online" && <StatusPill tone="info" className="mt-1.5">С сайта</StatusPill>}
                </li>
              );
            })}
          </ul>
        )}
        <LinkButton href="/mis/booking" variant="secondary" size="sm" className="w-full">Записать к врачу</LinkButton>
      </div>
    </div>
  );
}

/* ---------------- Назначения ---------------- */

function PrescriptionsTab({ patient }: { patient: Patient }) {
  const { role } = useSession();
  const toast = useToast();
  const canEdit = role?.id === "doctor";
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[17px] font-semibold text-forest-deep">Курс процедур</h2>
          <PrintButton label="Распечатать лист назначений" make={async () => <PrintPrescriptions patient={patient} course={await prescriptionsService.forPatient(patient.id)} />} />
        </div>
        <CourseList patientId={patient.id} canEdit={canEdit} onChanged={toast.show} />
      </div>
      {canEdit && patient.stay && <AddPrescription patient={patient} onAdded={toast.show} />}
      {!canEdit && <p className={`${card} h-fit p-5 text-[14px] text-muted`}>Назначения добавляет и отменяет врач. Медсестра отмечает выполнение в процедурном кабинете — счётчик курса меняется сразу.</p>}
      {toast.node}
    </div>
  );
}

/* ---------------- Расписание ---------------- */

function ScheduleTab({ patient }: { patient: Patient }) {
  const { data } = useService(async () => {
    const [sessions, appointments, services] = await Promise.all([proceduresService.forPatient(patient.id), appointmentsService.forPatient(patient.id), doctorsService.services()]);
    return { sessions, appointments, services };
  }, [patient.id]);
  if (!data) return <Loading />;

  type Item = { key: string; date: string; start: number; end: number; title: string; place: string; status: React.ReactNode; course?: string };
  const items: Item[] = [
    ...data.sessions.map((r) => ({
      key: r.session.id, date: r.session.date, start: r.session.start, end: r.session.end, title: r.procedure.title,
      place: `Кабинет №${r.room.number} · ${r.room.title}`, status: <SessionStatusPill status={r.session.status} />, course: `${r.index} из ${r.total}`,
    })),
    ...data.appointments.filter((a) => a.status !== "cancelled").map((a) => ({
      key: a.id, date: a.date, start: a.start, end: a.end, title: data.services.find((s) => s.id === a.serviceId)?.title ?? "Приём врача",
      place: `Кабинет №${a.roomId} · ${visitsService.doctorName(a.doctorId)}`,
      status: <StatusPill tone={a.status === "completed" ? "ok" : "info"} icon={Stethoscope}>{a.status === "completed" ? "Приём проведён" : "Приём врача"}</StatusPill>,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date) || a.start - b.start);

  if (!items.length) return <EmptyState icon={CalendarDays} title="Расписание пустое" text="Процедуры появятся здесь сразу после назначения врача." />;
  const days = [...new Set(items.map((i) => i.date))];

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <PrintButton label="Распечатать расписание" make={() => <PrintSchedule patient={patient} items={items.map((i) => ({ date: i.date, start: i.start, end: i.end, title: i.title, where: i.place }))} />} />
      </div>
      {days.map((d) => (
        <section key={d}>
          <h3 className={`mb-2 text-[15px] font-semibold capitalize ${d === DEMO_TODAY ? "text-teal" : "text-forest-deep"}`}>
            {d === DEMO_TODAY ? "Сегодня" : fmtWeekdayLong(d)}, {fmtDay(d)}
          </h3>
          <ul className={`${card} divide-y divide-line`}>
            {items.filter((i) => i.date === d).map((i) => (
              <li key={i.key} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-28 shrink-0 text-[15px] font-semibold tabular-nums text-forest-deep">{fmtRange(i.start, i.end)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] text-ink">{i.title}{i.course && <span className="ml-2 text-[13px] text-muted">{i.course}</span>}</span>
                  <span className="block text-[13px] text-muted">{i.place}</span>
                </span>
                {i.status}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/* ---------------- Документы ---------------- */

function DocumentsTab({ patient }: { patient: Patient }) {
  const { data } = useService(() => documentsService.forPatient(patient.id), [patient.id]);
  const [open, setOpen] = useState<MedDocument | null>(null);
  if (!data) return <Loading />;
  if (!data.length) return <EmptyState icon={FileText} title="Документов пока нет" text="Протокол появится после завершения приёма врача." />;
  return (
    <>
      <ul className={`${card} divide-y divide-line`}>
        {data.map((d) => (
          <li key={d.id}>
            <button onClick={() => setOpen(d)} className="flex w-full flex-col gap-2 p-4 text-left hover:bg-cream/40 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <FileText size={20} strokeWidth={1.5} className="hidden shrink-0 text-teal sm:block" />
              <span className="min-w-0 flex-1">
                <span className="block text-[15.5px] font-medium text-forest-deep">{d.title}</span>
                <span className="block text-[13.5px] text-muted">{fmtDay(d.date)} · {visitsService.doctorName(d.doctorId)}</span>
                {d.errorText && <span className="mt-1 block text-[13.5px] text-danger">{d.errorText}</span>}
              </span>
              <DocStatusPill status={d.status} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13.5px] text-muted">
        Подпись и отправка в ЕГИСЗ — в разделе <Link href="/mis/egisz" className="text-teal hover:underline">«ЕГИСЗ и документы»</Link>.
      </p>
      <DocumentModal doc={open} patient={patient} onClose={() => setOpen(null)} />
    </>
  );
}

/* ---------------- Анализы ---------------- */

function LabsTab({ patient }: { patient: Patient }) {
  const { data } = useService(() => labsService.forPatient(patient.id), [patient.id]);
  if (!data) return <Loading />;
  if (!data.length) return <EmptyState icon={FlaskConical} title="Анализов нет" text="Врач может назначить забор крови — результаты появятся здесь." />;
  return (
    <div className="space-y-4">
      {data.map((l) => (
        <div key={l.id} className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="text-[15.5px] font-medium text-forest-deep">{l.title}</div>
            <span className="text-[13.5px] text-muted">{fmtDay(l.date)}</span>
          </div>
          <table className="w-full text-[14.5px]">
            <thead className="text-left text-[12px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Показатель</th>
                <th className="px-3 py-2 font-medium">Результат</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Норма</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {l.items.map((i) => (
                <tr key={i.name}>
                  <td className="px-5 py-2.5 text-ink/85">{i.name}</td>
                  <td className="px-3 py-2.5">
                    <span className={`font-semibold tabular-nums ${i.flag ? "text-danger" : "text-forest-deep"}`}>{i.value}</span>
                    <span className="ml-1 text-[12.5px] text-muted">{i.unit}</span>
                    {i.flag && <StatusPill tone="danger" className="ml-2">{i.flag === "high" ? "выше нормы" : "ниже нормы"}</StatusPill>}
                  </td>
                  <td className="hidden px-3 py-2.5 text-muted sm:table-cell">{i.ref}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <p className="text-[13.5px] text-muted">Результаты лаборатории загружаются автоматически на этапе 4 развития системы.</p>
    </div>
  );
}
