"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BookOpen, Loader2, Send, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { HelpArticle } from "@/config/help";
import { useSession } from "@/hooks/useSession";
import { assistantService } from "@/services";

type Message =
  | { id: number; from: "user"; text: string }
  | { id: number; from: "bot"; article: HelpArticle | null; related: HelpArticle[] };

/**
 * ИИ-помощник по системе: плавающая кнопка на всех экранах МИС.
 * Сотрудник пишет вопрос своими словами — помощник отвечает по шагам и даёт ссылку на экран.
 */
export function Assistant() {
  const { role } = useSession();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const seq = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);
  const suggestions = assistantService.suggestions(role?.id);
  const params = useSearchParams();
  const preset = params.get("ask");
  const asked = useRef<string | null>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const ask = async (q: string) => {
    const question = q.trim();
    if (!question || busy) return;
    setText("");
    setMessages((m) => [...m, { id: ++seq.current, from: "user", text: question }]);
    setBusy(true);
    const res = await assistantService.ask(question, role?.id);
    setBusy(false);
    setMessages((m) => [...m, { id: ++seq.current, from: "bot", ...res }]);
  };

  // Демо-сценарий: ?ask=… открывает помощника и сразу задаёт вопрос
  useEffect(() => {
    if (!preset || asked.current === preset) return;
    asked.current = preset;
    Promise.resolve().then(() => {
      setOpen(true);
      ask(preset);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="fixed bottom-4 left-4 z-[56] flex h-12 print:hidden items-center gap-2 rounded-full bg-gold pl-3.5 pr-5 text-[14.5px] font-semibold text-forest-deep shadow-[var(--shadow-lift)] transition hover:bg-[#dcb878] sm:bottom-6 lg:left-[288px]"
      >
        <Sparkles size={18} /> Помощник
      </button>

      <AnimatePresence>
        {open && (
          <motion.section
            role="dialog"
            aria-label="Помощник по системе"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            className="fixed inset-x-3 bottom-20 z-[57] flex max-h-[min(640px,calc(100vh-110px))] flex-col overflow-hidden rounded-3xl border border-line bg-milk shadow-[var(--shadow-lift)] sm:inset-x-auto sm:left-6 sm:w-[400px] lg:left-[288px]"
          >
            <header className="flex items-center justify-between gap-3 bg-forest-deep px-5 py-4 text-milk">
              <div>
                <div className="flex items-center gap-2 text-[16px] font-semibold"><Sparkles size={17} className="text-gold" /> Помощник</div>
                <div className="text-[12.5px] text-sage">Спросите своими словами, как что-то сделать</div>
              </div>
              <button onClick={() => setOpen(false)} aria-label="Закрыть помощника" className="grid h-9 w-9 place-items-center rounded-full hover:bg-milk/10"><X size={17} /></button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <Bubble>
                Здравствуйте! Я подскажу, где что находится и как это сделать. Например:
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => ask(s)} className="min-h-8 rounded-full border border-line bg-white px-3 text-left text-[13px] text-forest hover:border-forest/40">{s}</button>
                  ))}
                </div>
              </Bubble>
              {messages.map((m) =>
                m.from === "user" ? (
                  <div key={m.id} className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-md bg-forest px-4 py-2.5 text-[14.5px] text-milk">{m.text}</div>
                ) : (
                  <Bubble key={m.id}>
                    {m.article ? (
                      <>
                        <div className="font-semibold text-forest-deep">{m.article.title}</div>
                        <ol className="mt-2 space-y-1.5">
                          {m.article.steps.map((s, i) => (
                            <li key={s} className="flex gap-2"><span className="font-semibold text-teal">{i + 1}.</span><span>{s}</span></li>
                          ))}
                        </ol>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link href={m.article.href} onClick={() => setOpen(false)} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest px-4 text-[13.5px] font-medium text-milk">
                            Открыть экран <ArrowRight size={14} />
                          </Link>
                          <Link href={`/mis/help?a=${m.article.id}`} onClick={() => setOpen(false)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-[13.5px] text-forest">
                            <BookOpen size={14} /> В справке
                          </Link>
                        </div>
                        {m.related.length > 0 && (
                          <div className="mt-3 border-t border-line pt-2 text-[13px] text-muted">
                            Ещё может пригодиться:{" "}
                            {m.related.map((r, i) => (
                              <span key={r.id}>{i > 0 && ", "}<button onClick={() => ask(r.title)} className="text-teal hover:underline">{r.title.toLowerCase()}</button></span>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        Не нашёл точного ответа. Попробуйте спросить иначе — например, одним-двумя словами: «выписка», «заселить», «отменить процедуру».
                        <Link href="/mis/help" onClick={() => setOpen(false)} className="mt-2 flex items-center gap-1.5 text-teal hover:underline"><BookOpen size={14} /> Открыть всю справку</Link>
                      </>
                    )}
                  </Bubble>
                ),
              )}
              {busy && <Bubble><span className="inline-flex items-center gap-2 text-muted"><Loader2 size={15} className="animate-spin" /> Ищу ответ…</span></Bubble>}
              <div ref={bottom} />
            </div>

            <form onSubmit={(e) => { e.preventDefault(); ask(text); }} className="border-t border-line p-3">
              <div className="flex gap-2">
                <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Например: как отменить процедуру?" aria-label="Вопрос помощнику" className="h-11 min-w-0 flex-1 rounded-full border border-line bg-white px-4 text-[15px] outline-none focus:border-forest/50" />
                <button type="submit" disabled={!text.trim() || busy} aria-label="Отправить вопрос" className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-forest text-milk disabled:opacity-40"><Send size={17} /></button>
              </div>
              <p className="mt-2 px-1 text-[11.5px] leading-snug text-muted">В рабочей версии помощник обучен на полной документации системы и работает на сервере компании.</p>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  );
}

function Bubble({ children }: { children: React.ReactNode }) {
  return <div className="w-fit max-w-[92%] rounded-2xl rounded-bl-md bg-cream px-4 py-3 text-[14.5px] leading-relaxed text-ink/90">{children}</div>;
}
