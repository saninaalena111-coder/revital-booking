"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, Mic, Square, Wand2 } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/* Web Speech API нет в стандартных типах TypeScript — описываем то, что используем */
interface RecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}
interface RecognitionEvent {
  resultIndex: number;
  results: ArrayLike<RecognitionResult>;
}
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type RecognitionCtor = new () => Recognition;

const getCtor = (): RecognitionCtor | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Поддерживает ли браузер распознавание речи (на сервере — «нет», без мерцания при гидратации) */
const useSupported = () => useSyncExternalStore(() => () => {}, () => !!getCtor(), () => false);

/**
 * Голосовой ввод: распознавание через браузер (ru-RU), текст попадает в выбранное поле.
 * Если браузер не умеет распознавать речь — подсказка и вставка заготовленного текста.
 */
export function VoiceInput({ fieldLabel, onText, sample }: { fieldLabel: string; onText: (text: string) => void; sample: string }) {
  const supported = useSupported();
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);
  const onTextRef = useRef(onText);
  useEffect(() => {
    onTextRef.current = onText;
  }, [onText]);

  useEffect(() => () => rec.current?.stop(), []);

  const start = () => {
    const Ctor = getCtor();
    if (!Ctor) return;
    setError(null);
    const r = new Ctor();
    r.lang = "ru-RU";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      let live = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) onTextRef.current(capitalize(res[0].transcript.trim()));
        else live += res[0].transcript;
      }
      setInterim(live);
    };
    r.onerror = (e) => {
      setError(e.error === "not-allowed" ? "Нет доступа к микрофону. Разрешите его в настройках браузера." : "Не удалось распознать речь. Попробуйте ещё раз.");
    };
    r.onend = () => {
      setListening(false);
      setInterim("");
    };
    rec.current = r;
    r.start();
    setListening(true);
  };

  const stop = () => rec.current?.stop();

  return (
    <div className="rounded-3xl bg-forest-deep p-4 text-milk sm:p-5">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={supported ? (listening ? stop : start) : () => onText(sample)}
          aria-label={listening ? "Остановить диктовку" : `Диктовать в поле «${fieldLabel}»`}
          className={`relative grid h-16 w-16 shrink-0 place-items-center rounded-full transition ${listening ? "bg-danger" : "bg-gold text-forest-deep hover:bg-[#dcb878]"}`}
        >
          {listening && <motion.span className="absolute inset-0 rounded-full bg-danger" animate={{ scale: [1, 1.35], opacity: [0.5, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />}
          {listening ? <Square size={22} className="relative" fill="currentColor" /> : supported ? <Mic size={26} /> : <Wand2 size={24} />}
        </button>
        <div className="min-w-0">
          <div className="text-[16px] font-semibold">
            {listening ? "Говорите — текст появляется в поле" : supported ? "Диктовать голосом" : "Вставить пример диктовки"}
          </div>
          <div className="text-[14px] text-sage">
            Поле: <span className="font-medium text-milk">«{fieldLabel}»</span>
            {!listening && " — нажмите на нужное поле, чтобы выбрать его"}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {listening && interim && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-3 rounded-2xl bg-milk/10 px-4 py-2 text-[14px] italic text-sage">
            {interim}…
          </motion.p>
        )}
      </AnimatePresence>

      {error && <p className="mt-3 text-[14px] text-gold-soft">{error}</p>}
      {!supported && (
        <p className="mt-3 flex gap-2 text-[13.5px] text-sage">
          <Info size={15} className="mt-0.5 shrink-0" />
          Этот браузер не распознаёт речь. Голосовой ввод работает в Google Chrome и Яндекс Браузере; здесь можно вставить заготовленный текст.
        </p>
      )}
      {supported && !listening && (
        <button type="button" onClick={() => onText(sample)} className="mt-3 text-[13.5px] text-sage underline-offset-4 hover:text-milk hover:underline">
          Нет микрофона? Вставить пример диктовки
        </button>
      )}
      <p className="mt-3 border-t border-milk/10 pt-3 text-[12.5px] leading-relaxed text-sage/90">
        В рабочей версии — распознавание медицинской речи (например, Yandex SpeechKit), без доплат за модуль.
      </p>
    </div>
  );
}

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);
