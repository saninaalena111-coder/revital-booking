"use client";

import { AlertTriangle, Check, DoorOpen, Loader2, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import type { Appointment, Attribution, Patient, Slot } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { DoctorPortrait } from "@/components/brand/DoctorPortrait";
import { useService } from "@/hooks/useService";
import { appointmentsService, doctorsService, patientsService } from "@/services";
import { fmtDay, fmtTime, fmtWeekdayLong } from "@/lib/time";
import { StepTitle } from "./BookingFlow";
import { Field } from "./Steps";

interface Props {
  slot: Slot;
  serviceId: string;
  patient?: Patient;
  attribution: Attribution;
  onDone: (a: Appointment) => void;
}

export function ContactsStep({ slot, serviceId, patient, attribution, onDone }: Props) {
  const [name, setName] = useState(patient ? `${patient.firstName} ${patient.lastName}` : "");
  const [phone, setPhone] = useState(patient?.phone ?? "");
  const [consent, setConsent] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data } = useService(async () => {
    const [doctor, service, current] = await Promise.all([doctorsService.get(slot.doctorId), doctorsService.service(serviceId), patientsService.current()]);
    return { doctor, service, current };
  }, [slot.doctorId, serviceId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      const a = await appointmentsService.create({
        // Демо: все записи привязываются к пациенту «этого устройства», чтобы их было видно в личном кабинете
        patientId: data.current.id,
        patientName: name || `${data.current.firstName} ${data.current.lastName}`,
        phone,
        slot,
        serviceId,
        attribution,
      });
      onDone(a);
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setName("Анна Смирнова");
    setPhone("+7 (900) 123-45-67");
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_1fr]">
      <div>
        <StepTitle eyebrow="Почти готово" title="Как с вами связаться?" lead="Пришлём подтверждение и напомним о приёме." />
        <form onSubmit={submit} className="space-y-4">
          <Field label="Имя и фамилия" value={name} onChange={setName} placeholder="Анна Смирнова" />
          <Field label="Телефон" type="tel" value={phone} onChange={setPhone} placeholder="+7 (900) 123-45-67" />
          {!patient && (
            <button type="button" onClick={fillDemo} className="text-xs text-teal underline-offset-4 hover:underline">
              Заполнить демо-данными
            </button>
          )}

          <div className="pt-2">
            <div className="mb-2 text-[13px] font-medium text-ink/70">Напоминания</div>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-forest bg-forest/[0.05] px-4 py-2 text-sm text-forest">
                <MessageSquare size={14} /> SMS <Check size={14} />
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted">
                <Send size={14} /> Telegram · скоро
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm text-muted">MAX · скоро</span>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 pt-3 text-[13px] leading-relaxed text-muted">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#2f5451]" />
            Согласен(на) на обработку персональных данных для записи и напоминаний о приёме
          </label>

          {error && (
            <div className="flex items-center gap-2 rounded-2xl bg-danger-soft p-4 text-sm text-danger">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <Button type="submit" size="lg" disabled={!consent || busy || !data} className="mt-2 w-full sm:w-auto">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            {busy ? "Бронируем время…" : "Подтвердить запись"}
          </Button>
        </form>
      </div>

      {data?.doctor && (
        <aside className="h-fit rounded-[32px] border border-line bg-cream/60 p-6 sm:p-7 lg:sticky lg:top-24">
          <div className="flex gap-4">
            <DoctorPortrait doctor={data.doctor} className="aspect-[4/5] w-24 shrink-0" rounded="rounded-2xl" />
            <div>
              <div className="font-display text-[24px] leading-tight text-forest-deep">
                {data.doctor.firstName} {data.doctor.patronymic} {data.doctor.lastName}
              </div>
              <div className="mt-1 text-sm text-muted">{data.doctor.specialties.join(" · ")}</div>
            </div>
          </div>
          <dl className="mt-6 space-y-4 border-t border-line pt-6 text-[15px]">
            <Row label="Услуга" value={data.service?.title} />
            <Row label="Дата" value={`${fmtDay(slot.date)}, ${fmtWeekdayLong(slot.date)}`} />
            <Row label="Время" value={`${fmtTime(slot.start)}–${fmtTime(slot.end)}`} />
            <Row label="Где" value="Revital Park, медицинский центр" />
          </dl>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-milk p-4 text-[13px] leading-relaxed text-muted">
            <DoorOpen size={16} className="mt-0.5 shrink-0 text-teal" />
            Кабинет назначается автоматически и будет указан после подтверждения записи.
          </div>
        </aside>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium text-forest-deep">{value}</dd>
    </div>
  );
}
