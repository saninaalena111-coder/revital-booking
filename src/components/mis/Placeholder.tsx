"use client";

import { Hammer } from "lucide-react";
import { MisTitle } from "./MisShell";

/** Временный экран: раздел МИС собирается на следующих шагах прототипа */
export function Placeholder({ title, lead, step }: { title: string; lead: string; step: string }) {
  return (
    <>
      <MisTitle title={title} lead={lead} />
      <div className="rounded-3xl border border-dashed border-line bg-milk p-8 text-center sm:p-12">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sage-soft text-forest">
          <Hammer size={22} strokeWidth={1.5} />
        </span>
        <div className="mt-4 text-lg font-semibold text-forest-deep">Экран собирается</div>
        <p className="mt-1 text-[15px] text-muted">{step}</p>
      </div>
    </>
  );
}
