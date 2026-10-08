"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Tag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import type { Appointment, Attribution, ISODate, Patient, Slot } from "@/lib/types";
import { attributionFrom } from "@/lib/attribution";
import { addDays, daysBetween, DEMO_TODAY } from "@/lib/time";
import { GUEST_PRIMARY_SERVICE_ID, THERAPIST_IDS } from "@/lib/rules";
import { StatusStep, GuestIdStep, GuestFoundStep, FutureIntroStep, FutureDateStep, DirectionStep, ServiceStep } from "./Steps";
import { DoctorStep } from "./DoctorStep";
import { SlotStep } from "./SlotStep";
import { ContactsStep } from "./ContactsStep";
import { SuccessStep } from "./SuccessStep";

export type Path = "guest" | "future" | "outpatient";
export type Step =
  | "status" | "guest-id" | "guest-found" | "future-intro" | "future-date"
  | "direction" | "doctor" | "service" | "slot" | "contacts" | "done";

export interface FlowState {
  path?: Path;
  patient?: Patient;
  arrival?: ISODate;
  directionId?: string;
  /** "any" — ближайший свободный терапевт */
  doctorId?: string;
  serviceId?: string;
  slot?: Slot;
  appointment?: Appointment;
}

const PROGRESS: Record<Step, number> = {
  status: 0, "guest-id": 1, "guest-found": 1, "future-intro": 1, "future-date": 1, direction: 1,
  doctor: 2, service: 2, slot: 3, contacts: 4, done: 5,
};
const LABELS = ["Статус", "Пациент", "Специалист", "Время", "Подтверждение"];

export function BookingFlow() {
  const params = useSearchParams();
  const attribution: Attribution = useMemo(() => attributionFrom(new URLSearchParams(params.toString()), "/booking"), [params]);

  const initialPath = params.get("path") as Path | null;
  const initialDirection = params.get("direction");
  const firstStep: Step =
    initialPath === "guest" ? "guest-id" : initialPath === "future" ? "future-intro" : initialPath === "outpatient" || initialDirection ? (initialDirection ? "doctor" : "direction") : "status";

  const [history, setHistory] = useState<Step[]>([firstStep]);
  const [s, setS] = useState<FlowState>({
    path: initialPath ?? (initialDirection ? "outpatient" : undefined),
    directionId: initialDirection ?? undefined,
  });
  const step = history[history.length - 1];

  const go = (next: Step, patch: Partial<FlowState> = {}) => {
    setS((prev) => ({ ...prev, ...patch }));
    setHistory((h) => [...h, next]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => setHistory((h) => (h.length > 1 ? h.slice(0, -1) : h));
  const restart = () => {
    setS({});
    setHistory(["status"]);
  };

  // Диапазон дат зависит от типа пациента
  const dates: ISODate[] =
    s.path === "guest" && s.patient?.stay
      ? daysBetween(DEMO_TODAY > s.patient.stay.from ? DEMO_TODAY : s.patient.stay.from, s.patient.stay.to)
      : s.path === "future" && s.arrival
        ? daysBetween(s.arrival, addDays(s.arrival, 2))
        : daysBetween(DEMO_TODAY, addDays(DEMO_TODAY, 13));

  const serviceId = s.path === "outpatient" ? s.serviceId : GUEST_PRIMARY_SERVICE_ID;
  const doctorIds = s.doctorId === "any" ? THERAPIST_IDS : s.doctorId ? [s.doctorId] : [];

  const progress = PROGRESS[step];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-4 sm:px-8 sm:pt-8">
      {step !== "done" && (
        <div className="mb-10">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={back}
              disabled={history.length === 1}
              className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-forest disabled:invisible"
            >
              <ArrowLeft size={16} /> Назад
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream px-3 py-1 text-[11px] text-muted" title="Демо: источник обращения сохраняется вместе с записью">
              <Tag size={11} /> Источник: {attribution.source}
              {attribution.campaign !== "—" && ` · ${attribution.campaign}`}
            </span>
          </div>
          <div className="mt-6 grid grid-cols-5 gap-2">
            {LABELS.map((l, i) => (
              <div key={l}>
                <div className="h-[3px] overflow-hidden rounded-full bg-sand">
                  <motion.div className="h-full bg-forest" initial={false} animate={{ width: i < progress ? "100%" : i === progress ? "45%" : "0%" }} transition={{ duration: 0.5 }} />
                </div>
                <div className={`mt-2 hidden text-[11px] sm:block ${i <= progress ? "text-forest" : "text-muted"}`}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === "status" && (
            <StatusStep
              onPick={(p) => go(p === "guest" ? "guest-id" : p === "future" ? "future-intro" : "direction", { path: p, doctorId: undefined, serviceId: undefined, slot: undefined })}
            />
          )}
          {step === "guest-id" && <GuestIdStep onFound={(patient) => go("guest-found", { patient, path: "guest" })} />}
          {step === "guest-found" && s.patient && <GuestFoundStep patient={s.patient} onNext={() => go("doctor")} />}
          {step === "future-intro" && (
            <FutureIntroStep onPlan={() => go("future-date", { path: "future" })} onOutpatient={() => go("direction", { path: "outpatient" })} />
          )}
          {step === "future-date" && <FutureDateStep value={s.arrival} onPick={(arrival) => go("doctor", { arrival, slot: undefined })} />}
          {step === "direction" && <DirectionStep onPick={(directionId) => go("doctor", { directionId, doctorId: undefined, serviceId: undefined })} />}
          {step === "doctor" && (
            <DoctorStep
              mode={s.path === "outpatient" ? "direction" : "therapist"}
              directionId={s.directionId}
              from={dates[0]}
              guest={s.path === "guest"}
              onPick={(doctorId) => go(s.path === "outpatient" ? "service" : "slot", { doctorId, slot: undefined })}
            />
          )}
          {step === "service" && s.doctorId && s.directionId && (
            <ServiceStep doctorId={s.doctorId} directionId={s.directionId} onPick={(id) => go("slot", { serviceId: id, slot: undefined })} />
          )}
          {step === "slot" && serviceId && (
            <SlotStep
              path={s.path!}
              doctorIds={doctorIds}
              serviceId={serviceId}
              dates={dates}
              arrival={s.arrival}
              value={s.slot}
              onChange={(slot) => setS((p) => ({ ...p, slot }))}
              onNext={() => go("contacts")}
            />
          )}
          {step === "contacts" && s.slot && serviceId && (
            <ContactsStep
              slot={s.slot}
              serviceId={serviceId}
              patient={s.patient}
              attribution={attribution}
              onDone={(appointment) => go("done", { appointment })}
            />
          )}
          {step === "done" && s.appointment && <SuccessStep appointment={s.appointment} onRestart={restart} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function StepTitle({ eyebrow, title, lead }: { eyebrow?: string; title: React.ReactNode; lead?: React.ReactNode }) {
  return (
    <div className="mb-9 max-w-3xl">
      {eyebrow && <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal">{eyebrow}</div>}
      <h1 className="font-display text-[34px] leading-[1.05] text-forest-deep sm:text-[48px]">{title}</h1>
      {lead && <p className="mt-4 text-[16.5px] leading-relaxed text-muted">{lead}</p>}
    </div>
  );
}
