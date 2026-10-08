"use client";

import { motion } from "framer-motion";
import { ArrowDown, ArrowUp, Camera, Database, Globe, Megaphone, MessageSquare, QrCode, Send, Smartphone } from "lucide-react";
import { LogoMark } from "@/components/brand/Logo";

const SOURCES = [
  { icon: Globe, label: "Сайт" },
  { icon: Camera, label: "Соцсети" },
  { icon: Megaphone, label: "Реклама" },
  { icon: QrCode, label: "QR-код" },
  { icon: Send, label: "Telegram" },
  { icon: MessageSquare, label: "MAX" },
  { icon: Smartphone, label: "SMS" },
];

function Flow({ up, down }: { up: string; down: string }) {
  return (
    <div className="relative mx-auto flex h-28 w-full max-w-2xl items-center justify-center">
      <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-line via-teal/40 to-line" />
      {[0, 1, 2].map((i) => (
        <motion.span
          key={`d${i}`}
          className="absolute left-1/2 h-2 w-2 -translate-x-[calc(50%+10px)] rounded-full bg-teal"
          initial={{ top: "0%", opacity: 0 }}
          animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: i * 0.8, ease: "linear" }}
        />
      ))}
      {[0, 1, 2].map((i) => (
        <motion.span
          key={`u${i}`}
          className="absolute left-1/2 h-2 w-2 translate-x-[calc(-50%+10px)] rounded-full bg-gold"
          initial={{ top: "100%", opacity: 0 }}
          animate={{ top: ["100%", "0%"], opacity: [0, 1, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.4 + i * 0.8, ease: "linear" }}
        />
      ))}
      <div className="absolute right-[calc(50%+28px)] flex items-center gap-1.5 text-right text-[12.5px] text-muted">
        {down} <ArrowDown size={13} className="shrink-0 text-teal" />
      </div>
      <div className="absolute left-[calc(50%+28px)] flex items-center gap-1.5 text-[12.5px] text-muted">
        <ArrowUp size={13} className="shrink-0 text-gold" /> {up}
      </div>
    </div>
  );
}

export function Architecture() {
  return (
    <div className="rounded-[36px] border border-line bg-gradient-to-b from-milk to-cream/60 px-4 py-10 sm:px-10 sm:py-14">
      {/* 1. источники */}
      <div className="text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal">Сайт · соцсети · реклама</div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {SOURCES.map((s) => (
            <span key={s.label} className="inline-flex items-center gap-2 rounded-full border border-line bg-milk px-3.5 py-2 text-sm text-ink/80">
              <s.icon size={14} strokeWidth={1.5} className="text-teal" /> {s.label}
            </span>
          ))}
        </div>
      </div>

      <Flow down="пациент переходит по ссылке" up="подтверждение и напоминания" />

      {/* 2. наша система */}
      <div className="mx-auto max-w-2xl rounded-[28px] bg-forest-deep p-6 text-center text-milk shadow-[var(--shadow-lift)] sm:p-8">
        <div className="flex items-center justify-center gap-3">
          <LogoMark light className="h-9 w-9" />
          <div className="font-display text-3xl sm:text-4xl">Revital Medical Booking</div>
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2 text-[13px]">
          {["Онлайн-запись", "Подбор кабинета", "SMS-напоминания", "Личный кабинет", "Аналитика источников"].map((x) => (
            <span key={x} className="rounded-full bg-milk/10 px-3 py-1.5 text-sage">
              {x}
            </span>
          ))}
        </div>
      </div>

      <Flow down="новая запись, перенос, отмена" up="врачи, смены, кабинеты, занятость" />

      {/* 3. API */}
      <div className="mx-auto w-fit rounded-full border-2 border-dashed border-gold bg-gold-soft/60 px-8 py-3 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7a5a1c]">API</div>
        <div className="text-sm text-ink/80">защищённый программный доступ</div>
      </div>

      <Flow down="запросы и команды" up="данные и события об изменениях" />

      {/* 4. МИС */}
      <div className="mx-auto max-w-2xl rounded-[28px] border border-line bg-milk p-6 text-center sm:p-8">
        <div className="flex items-center justify-center gap-3">
          <Database size={26} strokeWidth={1.3} className="text-teal" />
          <div className="font-display text-3xl text-forest-deep sm:text-4xl">МИС «Санаториум»</div>
        </div>
        <p className="mt-3 text-[15px] text-muted">Медицинское ядро: расписание, медицинская карта, назначения, документация</p>
      </div>
    </div>
  );
}
