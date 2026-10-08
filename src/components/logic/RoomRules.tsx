"use client";

import { motion } from "framer-motion";
import { Check, DoorOpen, Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";
import type { Room, RoomAccess } from "@/lib/types";
import { canUseRoom } from "@/lib/scheduling/engine";
import { useService } from "@/hooks/useService";
import { doctorsService, roomsService } from "@/services";
import { Segmented } from "@/components/ui/Segmented";
import { SectionTitle } from "@/components/ui/Eyebrow";
import { DoctorPortrait } from "@/components/brand/DoctorPortrait";

export const ACCESS_LABEL: Record<RoomAccess, string> = {
  personal: "Персональный",
  group: "Ограничен группой",
  shared: "Общий",
};

/** Правило основного кабинета: интерактивная настройка режима доступа */
export function RoomAccessDemo() {
  const { data } = useService(async () => {
    const [doctors, rooms] = await Promise.all([doctorsService.list(), roomsService.list()]);
    return { doctors, rooms };
  }, []);
  const [mode, setMode] = useState<RoomAccess>("personal");
  if (!data) return null;

  const base = data.rooms.find((r) => r.id === "201")!;
  const room: Room = { ...base, access: mode, allowedDoctorIds: mode === "group" ? ["orlova", "volkova"] : undefined };

  return (
    <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <SectionTitle
            eyebrow="Правило основного кабинета"
            title="№201 закреплён только за Марией Ивановной"
            lead="Другому врачу система не назначит этот кабинет, даже если он физически свободен. Для каждого кабинета задаётся режим доступа."
          />
          <ul className="mt-8 space-y-4 text-[15px]">
            <li className="flex gap-3"><b className="w-44 shrink-0 text-forest-deep">Персональный</b><span className="text-muted">только один закреплённый врач</span></li>
            <li className="flex gap-3"><b className="w-44 shrink-0 text-forest-deep">Ограничен группой</b><span className="text-muted">несколько указанных специалистов — например, физиотерапевты</span></li>
            <li className="flex gap-3"><b className="w-44 shrink-0 text-forest-deep">Общий</b><span className="text-muted">любой врач, которому разрешена услуга</span></li>
          </ul>
        </div>

        <div className="min-w-0 rounded-[32px] border border-line bg-milk p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sage-soft text-forest">
                <DoorOpen size={22} strokeWidth={1.4} />
              </span>
              <div>
                <div className="font-display text-3xl text-forest-deep">Кабинет №201</div>
                <div className="text-sm text-muted">Режим доступа — попробуйте переключить</div>
              </div>
            </div>
          </div>
          <Segmented
            className="mt-6"
            value={mode}
            onChange={setMode}
            options={(["personal", "group", "shared"] as RoomAccess[]).map((v) => ({ value: v, label: ACCESS_LABEL[v] }))}
          />
          <div className="mt-6 divide-y divide-line">
            {data.doctors.map((d) => {
              const r = canUseRoom(room, d.id);
              return (
                <motion.div layout key={d.id} className="flex items-center gap-4 py-3">
                  <DoctorPortrait doctor={d} className="h-10 w-10 shrink-0" rounded="rounded-full" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-medium text-forest-deep">{d.firstName} {d.patronymic} {d.lastName}</div>
                    <div className="truncate text-xs text-muted">{r.reason}</div>
                  </div>
                  <motion.span
                    key={`${mode}-${r.ok}`}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${r.ok ? "bg-ok-soft text-ok" : "bg-danger-soft text-danger"}`}
                  >
                    {r.ok ? <Check size={12} /> : <X size={12} />}
                    {r.ok ? "можно назначить" : "нельзя"}
                  </motion.span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Почему кабинет не показывается пациенту при выборе */
export function HiddenRoomPrinciple() {
  const cols = [
    { icon: Eye, title: "Пациент выбирает", items: ["специалиста", "услугу", "дату", "время"], tone: "light" },
    { icon: DoorOpen, title: "Система определяет", items: ["подходящий свободный кабинет", "с учётом режима доступа", "и оборудования для услуги"], tone: "dark" },
    { icon: EyeOff, title: "Кабинет виден", items: ["после подтверждения записи", "или ближе ко времени визита"], tone: "light" },
  ];
  return (
    <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-8">
      <SectionTitle
        eyebrow="Не показываем кабинет при выборе"
        title="Пациенту не нужно думать о кабинетах"
        lead="Внутреннее распределение кабинетов может меняться: процедуру перенесли в соседний кабинет — пациенту не придёт лишних сообщений, а время записи останется прежним."
      />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {cols.map((c, i) => (
          <motion.div
            key={c.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`rounded-[28px] p-7 ${c.tone === "dark" ? "bg-forest-deep text-milk" : "border border-line bg-milk"}`}
          >
            <c.icon size={22} strokeWidth={1.4} className={c.tone === "dark" ? "text-gold" : "text-teal"} />
            <div className={`font-display mt-6 text-[28px] ${c.tone === "dark" ? "" : "text-forest-deep"}`}>{c.title}</div>
            <ul className={`mt-4 space-y-2 text-[15px] ${c.tone === "dark" ? "text-sage" : "text-muted"}`}>
              {c.items.map((x) => (
                <li key={x} className="flex items-center gap-2">
                  <span className={`h-1 w-1 rounded-full ${c.tone === "dark" ? "bg-gold" : "bg-teal"}`} /> {x}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
