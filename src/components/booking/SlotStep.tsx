"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import type { ISODate, Slot } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useService } from "@/hooks/useService";
import { doctorsService } from "@/services";
import { fmtDay, fmtTime } from "@/lib/time";
import { SlotPicker } from "./SlotPicker";
import { StepTitle, type Path } from "./BookingFlow";

interface Props {
  path: Path;
  doctorIds: string[];
  serviceId: string;
  dates: ISODate[];
  arrival?: ISODate;
  value?: Slot;
  onChange: (s: Slot) => void;
  onNext: () => void;
}

export function SlotStep({ path, doctorIds, serviceId, dates, arrival, value, onChange, onNext }: Props) {
  const { data } = useService(async () => {
    const [service, doctors] = await Promise.all([doctorsService.service(serviceId), doctorsService.list()]);
    return { service, doctors };
  }, [serviceId]);
  const single = doctorIds.length === 1 ? data?.doctors.find((d) => d.id === doctorIds[0]) : undefined;
  const chosen = value ? data?.doctors.find((d) => d.id === value.doctorId) : undefined;

  return (
    <>
      <StepTitle
        eyebrow={single ? `${single.firstName} ${single.patronymic} ${single.lastName}` : "Ближайший свободный терапевт"}
        title="Выберите дату и время"
        lead={
          <>
            {data?.service?.title} · {data?.service?.durationMin} мин
            {path === "future" && arrival && <> · консультации после заезда {fmtDay(arrival)}</>}
          </>
        }
      />
      <SlotPicker doctorIds={doctorIds} serviceId={serviceId} dates={dates} value={value} onChange={onChange} initialDate={dates[0]} />

      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="glass sticky bottom-4 z-30 mt-8 flex flex-col gap-3 rounded-[24px] p-4 shadow-[var(--shadow-lift)] sm:flex-row sm:items-center sm:justify-between sm:p-5"
          >
            <div>
              <div className="font-display text-2xl text-forest-deep">
                {fmtDay(value.date)}, {fmtTime(value.start)}
              </div>
              {chosen && (
                <div className="text-sm text-muted">
                  {chosen.firstName} {chosen.patronymic} {chosen.lastName}
                </div>
              )}
            </div>
            <Button size="lg" onClick={onNext}>
              Продолжить <ArrowRight size={18} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
