"use client";

import { motion } from "framer-motion";
import { ArrowRight, Clock, Zap } from "lucide-react";
import type { Doctor, ISODate, Slot } from "@/lib/types";
import { DoctorPortrait } from "@/components/brand/DoctorPortrait";
import { useService } from "@/hooks/useService";
import { appointmentsService, doctorsService } from "@/services";
import { GUEST_PRIMARY_SERVICE_ID, THERAPIST_IDS } from "@/lib/rules";
import { fmtTime, relativeDay } from "@/lib/time";
import { StepTitle } from "./BookingFlow";

interface Props {
  mode: "therapist" | "direction";
  directionId?: string;
  from: ISODate;
  guest: boolean;
  onPick: (doctorId: string) => void;
}

export function DoctorStep({ mode, directionId, from, guest, onPick }: Props) {
  const { data } = useService(async () => {
    const [doctors, directions, services] = await Promise.all([
      mode === "therapist" ? doctorsService.list().then((l) => l.filter((d) => THERAPIST_IDS.includes(d.id))) : doctorsService.byDirection(directionId!),
      doctorsService.directions(),
      doctorsService.services(),
    ]);
    // Для каждого врача — ближайшее свободное время по основной услуге направления
    const rows = await Promise.all(
      doctors.map(async (d) => {
        const serviceId =
          mode === "therapist" ? GUEST_PRIMARY_SERVICE_ID : services.find((s) => s.directionId === directionId && s.doctorIds.includes(d.id))?.id ?? d.serviceIds[0];
        return { doctor: d, nearest: await appointmentsService.nearest(d.id, serviceId, from) };
      }),
    );
    return { rows, direction: directions.find((x) => x.id === directionId) };
  }, [mode, directionId, from]);

  const earliest = data?.rows
    .filter((r) => r.nearest)
    .sort((a, b) => (a.nearest!.date + fmtTime(a.nearest!.start)).localeCompare(b.nearest!.date + fmtTime(b.nearest!.start)))[0];

  return (
    <>
      <StepTitle
        eyebrow={mode === "therapist" ? "Первичный приём" : data?.direction?.title}
        title={mode === "therapist" ? "Выберите терапевта" : "Выберите специалиста"}
        lead={mode === "therapist" ? (guest ? "Показываем ближайшее свободное время в период вашего проживания." : "Показываем ближайшее время после даты заезда.") : undefined}
      />

      {mode === "therapist" && earliest && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onPick("any")}
          className="group mb-5 flex w-full items-center gap-5 rounded-[28px] bg-forest-deep p-5 text-left text-milk transition hover:bg-forest sm:p-6"
        >
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gold text-forest-deep">
            <Zap size={22} strokeWidth={1.6} />
          </span>
          <span className="flex-1">
            <span className="font-display block text-[28px] leading-tight">Ближайший свободный терапевт</span>
            <span className="mt-1 block text-sm text-sage">
              {relativeDay(earliest.nearest!.date)} в {fmtTime(earliest.nearest!.start)} — система подберёт врача сама
            </span>
          </span>
          <ArrowRight size={20} className="transition group-hover:translate-x-1" />
        </motion.button>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {data?.rows.map((r, i) => (
          <DoctorCard key={r.doctor.id} doctor={r.doctor} nearest={r.nearest} index={i} onPick={() => onPick(r.doctor.id)} />
        ))}
      </div>
    </>
  );
}

function DoctorCard({ doctor, nearest, index, onPick }: { doctor: Doctor; nearest: Slot | null; index: number; onPick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.07 }}
      onClick={onPick}
      disabled={!nearest}
      className="group flex gap-5 rounded-[28px] border border-line bg-milk p-4 text-left transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] disabled:opacity-50 sm:p-5"
    >
      <DoctorPortrait doctor={doctor} className="aspect-[4/5] w-[112px] shrink-0 sm:w-[132px]" />
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <div className="font-display text-[25px] leading-[1.08] text-forest-deep">
          {doctor.firstName} {doctor.patronymic}
          <br />
          {doctor.lastName}
        </div>
        <div className="mt-2 text-[13.5px] text-muted">{doctor.specialties.join(" · ")}</div>
        <div className="mt-1 text-xs text-muted/80">Стаж {doctor.experienceYears} лет</div>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-teal">
              <Clock size={12} /> Ближайшее время
            </div>
            <div className="mt-1 text-[15px] font-semibold text-forest-deep">
              {nearest ? (
                <>
                  {fmtTime(nearest.start)} <span className="font-normal text-muted">· {relativeDay(nearest.date)}</span>
                </>
              ) : (
                "нет свободного времени"
              )}
            </div>
          </div>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line text-forest transition group-hover:border-forest group-hover:bg-forest group-hover:text-milk">
            <ArrowRight size={16} />
          </span>
        </div>
      </div>
    </motion.button>
  );
}
