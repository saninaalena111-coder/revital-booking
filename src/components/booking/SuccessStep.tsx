"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarPlus, Check, DoorOpen, MessageSquare, RotateCcw } from "lucide-react";
import type { Appointment } from "@/lib/types";
import { Button, LinkButton } from "@/components/ui/Button";
import { useService } from "@/hooks/useService";
import { doctorsService, notificationsService, roomsService } from "@/services";
import { downloadIcs } from "@/lib/ics";
import { fmtDay, fmtTime } from "@/lib/time";

export function SuccessStep({ appointment: a, onRestart }: { appointment: Appointment; onRestart: () => void }) {
  const { data } = useService(async () => {
    const [doctor, service, room, sms] = await Promise.all([
      doctorsService.get(a.doctorId),
      doctorsService.service(a.serviceId!),
      roomsService.get(a.roomId!),
      notificationsService.list(),
    ]);
    return { doctor, service, room, sms: sms.filter((m) => m.appointmentId === a.id) };
  }, [a.id]);

  const doctorName = data?.doctor ? `${data.doctor.firstName} ${data.doctor.patronymic} ${data.doctor.lastName}` : "";

  return (
    <div className="mx-auto max-w-3xl pt-6 text-center">
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.45, duration: 0.8 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-forest text-milk shadow-[0_20px_40px_-16px_rgb(30_56_54/0.6)]"
      >
        <Check size={36} strokeWidth={2} />
      </motion.div>
      <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="font-display mt-8 text-6xl text-forest-deep sm:text-7xl">
        Вы записаны
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mx-auto mt-10 max-w-xl overflow-hidden rounded-[32px] border border-line bg-milk text-left shadow-[var(--shadow-soft)]"
      >
        <div className="p-7 sm:p-8">
          <div className="font-display text-[30px] leading-tight text-forest-deep">{doctorName}</div>
          <div className="mt-1 text-muted">{data?.service?.title}</div>
          <div className="mt-7 flex items-end gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-teal">Дата</div>
              <div className="font-display mt-1 text-4xl text-forest-deep">{fmtDay(a.date)}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.16em] text-teal">Время</div>
              <div className="font-display mt-1 text-4xl text-forest-deep">{fmtTime(a.start)}</div>
            </div>
          </div>
          <div className="mt-6 text-[15px] text-ink/80">Ревиталь Парк · медицинский центр</div>
        </div>
        {data?.room && (
          <div className="flex items-center gap-3 border-t border-line bg-cream/60 px-7 py-4 text-sm text-ink/80 sm:px-8">
            <DoorOpen size={16} className="text-teal" />
            Кабинет №{data.room.number}, {data.room.floor} этаж
            <span className="ml-auto text-xs text-muted">может измениться — напомним</span>
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 flex flex-wrap justify-center gap-3">
        <Button variant="secondary" onClick={() => downloadIcs(a, `Приём: ${doctorName}`, "Ревиталь Парк")}>
          <CalendarPlus size={17} /> Добавить в календарь
        </Button>
        <LinkButton href="/cabinet">Мои записи</LinkButton>
        <LinkButton href="/" variant="ghost">
          Вернуться на сайт
        </LinkButton>
      </motion.div>
      <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted">
        <MessageSquare size={15} className="text-teal" /> Мы напомним о приёме по СМС.
      </p>

      {data?.sms && data.sms.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mx-auto mt-14 max-w-xl text-left">
          <div className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">Какие СМС придут · демо</div>
          <div className="space-y-3">
            {data.sms.map((m) => (
              <div key={m.id} className="flex items-start gap-3">
                <div className="w-24 shrink-0 pt-3 text-right text-xs text-muted">{m.sendAt}</div>
                <div className={`flex-1 rounded-2xl rounded-tl-md px-4 py-3 text-[14px] leading-relaxed ${m.status === "sent" ? "bg-sage-soft text-ink" : "border border-dashed border-line text-ink/70"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-xs text-muted">Реальная отправка СМС в прототипе не подключена.</p>
        </motion.div>
      )}

      <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
        <button onClick={onRestart} className="inline-flex items-center gap-2 text-muted hover:text-forest">
          <RotateCcw size={14} /> Записаться ещё раз
        </button>
        <Link href={`/admin?tab=calendar&date=${a.date}`} className="text-teal hover:underline">
          Посмотреть запись глазами администратора →
        </Link>
      </div>
    </div>
  );
}
