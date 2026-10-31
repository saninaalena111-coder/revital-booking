"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown, Search, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import type { HelpArticle } from "@/config/help";
import { useSession } from "@/hooks/useSession";
import { assistantService } from "@/services";
import { MisTitle } from "../MisShell";
import { card, EmptyState } from "../ui";

/** Справка: статьи «Как…» по модулям — для того, кто впервые открыл систему */
export function Help() {
  const params = useSearchParams();
  const { role } = useSession();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(params.get("a"));
  const all = assistantService.articles();
  const list = all.filter((a) => !q || `${a.title} ${a.keywords.join(" ")}`.toLowerCase().includes(q.toLowerCase()));
  // Статьи своей роли — первыми
  const mine = list.filter((a) => role && a.roles?.includes(role.id));
  const modules = [...new Set(list.map((a) => a.module))];

  // Ссылка из помощника ведёт сразу к нужной статье
  useEffect(() => {
    const id = params.get("a");
    if (id) document.getElementById(`help-${id}`)?.scrollIntoView({ block: "center" });
  }, [params]);

  return (
    <>
      <MisTitle title="Справка" lead="Короткие инструкции: 3–6 шагов и ссылка на нужный экран. Можно также спросить помощника — кнопка «Помощник» внизу экрана." />
      <label className="relative mb-6 block max-w-xl">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Что нужно сделать? Например: выписка, заселить, отменить" className="h-14 w-full rounded-full border border-line bg-milk pl-12 pr-4 text-[16px] outline-none focus:border-forest/50" />
      </label>

      {!list.length && <EmptyState icon={Search} title="Ничего не нашли" text="Попробуйте другое слово или спросите помощника — он понимает вопросы своими словами." />}

      {mine.length > 0 && !q && (
        <section className="mb-8">
          <h2 className="mb-3 flex items-center gap-2 text-[17px] font-semibold text-forest-deep"><Sparkles size={18} className="text-gold" /> Для вашей роли: {role?.title.toLowerCase()}</h2>
          <Articles list={mine} open={open} setOpen={setOpen} />
        </section>
      )}

      {modules.map((m) => (
        <section key={m} className="mb-8">
          <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.16em] text-teal">{m}</h2>
          <Articles list={list.filter((a) => a.module === m)} open={open} setOpen={setOpen} />
        </section>
      ))}
    </>
  );
}

function Articles({ list, open, setOpen }: { list: HelpArticle[]; open: string | null; setOpen: (id: string | null) => void }) {
  return (
    <ul className={`${card} divide-y divide-line overflow-hidden`}>
      {list.map((a) => (
        <li key={a.id} id={`help-${a.id}`}>
          <button onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id} className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-3 text-left hover:bg-cream/40">
            <span className="text-[16px] font-medium text-forest-deep">{a.title}</span>
            <ChevronDown size={18} className={`shrink-0 text-muted transition ${open === a.id ? "rotate-180" : ""}`} />
          </button>
          {open === a.id && (
            <div className="px-5 pb-5">
              <ol className="space-y-2">
                {a.steps.map((s, i) => (
                  <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-ink/85">
                    <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-forest text-[12px] font-semibold text-milk">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ol>
              <Link href={a.href} className="mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-sage-soft px-4 text-[14px] font-medium text-forest hover:bg-sage">
                Открыть экран <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
