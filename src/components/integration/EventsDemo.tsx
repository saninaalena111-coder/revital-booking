"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Database, MessageSquare, RefreshCw, RotateCcw, Smartphone, Webhook } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { LogoMark } from "@/components/brand/Logo";

type Mode = "webhook" | "polling";

/**
 * Демо: администратор переносит запись прямо в «Санаториуме».
 * Показываем, как наша система узнаёт об изменении — мгновенно (webhook)
 * или при очередной проверке (периодическая синхронизация через API).
 */
export function EventsDemo() {
  const [mode, setMode] = useState<Mode>("webhook");
  const [stage, setStage] = useState(0); // 0 — исходно, 1 — изменено в МИС, 2 — событие/ожидание, 3 — запись обновлена, 4 — ЛК, 5 — СМС
  const [countdown, setCountdown] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const reset = () => {
    clear();
    setStage(0);
    setCountdown(0);
  };

  const run = () => {
    reset();
    const at = (ms: number, fn: () => void) => timers.current.push(setTimeout(fn, ms));
    at(100, () => setStage(1));
    if (mode === "webhook") {
      at(900, () => setStage(2));
      at(1900, () => setStage(3));
      at(2600, () => setStage(4));
      at(3300, () => setStage(5));
    } else {
      at(900, () => {
        setStage(2);
        setCountdown(5);
      });
      [1, 2, 3, 4, 5].forEach((i) => at(900 + i * 800, () => setCountdown(5 - i)));
      at(900 + 5 * 800 + 300, () => setStage(3));
      at(900 + 5 * 800 + 1000, () => setStage(4));
      at(900 + 5 * 800 + 1700, () => setStage(5));
    }
  };

  const time = stage >= 1 ? "12:00" : "11:00";
  const ourTime = stage >= 3 ? "12:00" : "11:00";
  const cabinetTime = stage >= 4 ? "12:00" : "11:00";

  return (
    <div className="rounded-[36px] border border-line bg-milk p-5 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Segmented
          value={mode}
          onChange={(m) => {
            setMode(m);
            reset();
          }}
          options={[
            { value: "webhook", label: "«Санаториум» сообщает сам" },
            { value: "polling", label: "Проверяем сами каждые 5 минут" },
          ]}
        />
        <div className="flex gap-2">
          <Button onClick={run} disabled={stage > 0 && stage < 5}>
            Перенести запись в «Санаториуме»
          </Button>
          {stage > 0 && (
            <Button variant="ghost" onClick={reset} aria-label="Сначала">
              <RotateCcw size={16} />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch">
        {/* МИС */}
        <Panel icon={<Database size={18} className="text-teal" />} title="МИС «Санаториум»" sub="рабочее место администратора">
          <div className="rounded-2xl border border-line p-4">
            <div className="text-xs text-muted">Смирнова Анна · Орлова М.И.</div>
            <div className="mt-2 flex items-center gap-3">
              <TimeChip value={time} changed={stage >= 1} />
              <span className="text-sm text-muted">12 октября</span>
            </div>
          </div>
          <Status show={stage >= 1} text="Администратор перенёс приём с 11:00 на 12:00" />
        </Panel>

        <Connector active={stage === 2} mode={mode} countdown={countdown} />

        {/* наша система */}
        <Panel icon={<LogoMark className="h-[18px] w-[18px]" />} title="Онлайн-запись Ревиталь" sub="наша система">
          <div className="space-y-2">
            <Step n={1} done={stage >= 3} text={`Обновила запись: ${ourTime}`} />
            <Step n={2} done={stage >= 4} text="Изменила время в личном кабинете" />
            <Step n={3} done={stage >= 5} text="Отправила СМС пациенту" />
          </div>
          {mode === "polling" && stage === 2 && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-gold-soft/60 px-3 py-2 text-[12.5px] text-[#7a5a1c]">
              <Clock size={13} /> Пока не знает об изменении — ждёт проверки
            </div>
          )}
        </Panel>

        <div className="hidden items-center justify-center lg:flex">
          <motion.div animate={{ opacity: stage >= 4 ? 1 : 0.3 }} className="h-px w-8 bg-teal" />
        </div>

        {/* пациент */}
        <Panel icon={<Smartphone size={18} className="text-teal" />} title="Телефон пациента" sub="личный кабинет и СМС">
          <div className="rounded-2xl bg-cream/70 p-4">
            <div className="text-xs text-muted">Мои записи · 12 октября</div>
            <div className="mt-2 flex items-center gap-3">
              <TimeChip value={cabinetTime} changed={stage >= 4} />
              <span className="text-sm text-ink/80">Орлова М.И.</span>
            </div>
          </div>
          <AnimatePresence>
            {stage >= 5 && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="mt-3 rounded-2xl rounded-tl-md bg-sage-soft p-3 text-[13px] leading-relaxed text-ink">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] text-muted">
                  <MessageSquare size={11} /> СМС · Ревиталь Парк
                </div>
                Ревиталь Парк: время вашего приёма изменено. Новое время — 12:00.
              </motion.div>
            )}
          </AnimatePresence>
        </Panel>
      </div>

      <AnimatePresence mode="wait">
        <motion.p key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-6 rounded-2xl bg-cream/60 p-4 text-[14px] leading-relaxed text-ink/75">
          {mode === "webhook" ? (
            <>
              <b className="text-forest-deep">Лучший вариант:</b> «Санаториум» сам сразу сообщает нашей системе об изменении — пациент узнаёт о переносе через несколько секунд.
            </>
          ) : (
            <>
              <b className="text-forest-deep">Запасной вариант:</b> если «Санаториум» не умеет сообщать сам, наша система каждые 5 минут спрашивает у него, что изменилось. Работает надёжно, но с задержкой. В демо 5 минут ускорены до 5 секунд.
            </>
          )}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

function Panel({ icon, title, sub, children }: { icon: React.ReactNode; title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[24px] border border-line bg-milk p-5">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-sage-soft">{icon}</span>
        <div>
          <div className="text-[14.5px] font-semibold text-forest-deep">{title}</div>
          <div className="text-[11.5px] text-muted">{sub}</div>
        </div>
      </div>
      {children}
    </div>
  );
}

function TimeChip({ value, changed }: { value: string; changed: boolean }) {
  return (
    <motion.span
      key={value}
      initial={changed ? { scale: 1.25, backgroundColor: "#d0ab67" } : false}
      animate={{ scale: 1, backgroundColor: changed ? "#2f5451" : "#ebe3d5" }}
      transition={{ duration: 0.6 }}
      className={`font-display rounded-xl px-3 py-1 text-2xl tabular-nums ${changed ? "text-milk" : "text-forest-deep"}`}
    >
      {value}
    </motion.span>
  );
}

function Status({ show, text }: { show: boolean; text: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 text-[13px] text-muted">
          {text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Step({ n, done, text }: { n: number; done: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] transition ${done ? "bg-ok-soft text-ok" : "bg-cream/60 text-muted"}`}>
      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${done ? "bg-ok text-milk" : "bg-milk text-muted"}`}>
        {done ? <Check size={12} strokeWidth={3} /> : n}
      </span>
      {text}
    </div>
  );
}

function Connector({ active, mode, countdown }: { active: boolean; mode: Mode; countdown: number }) {
  return (
    <div className="flex items-center justify-center py-2 lg:w-28 lg:flex-col">
      <div className="relative flex h-16 w-full items-center justify-center lg:h-full">
        <div className="absolute h-full w-px bg-line lg:h-px lg:w-full" />
        {active && mode === "webhook" && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1 }}
            className="absolute rounded-full bg-gold px-2 py-1 text-[10px] font-semibold text-forest-deep shadow"
          >
            <span className="flex items-center gap-1">
              <Webhook size={11} /> сообщение
            </span>
          </motion.span>
        )}
        {active && mode === "polling" && (
          <div className="relative flex flex-col items-center rounded-2xl border border-line bg-milk px-3 py-2 text-center">
            <RefreshCw size={14} className="animate-spin text-teal [animation-duration:2s]" />
            <span className="mt-1 text-[10.5px] leading-tight text-muted">проверка через</span>
            <span className="text-sm font-semibold tabular-nums text-forest-deep">{countdown} мин</span>
          </div>
        )}
      </div>
    </div>
  );
}
