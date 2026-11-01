"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Check, KeyRound, MapPin, Palette } from "lucide-react";
import { useState } from "react";
import { ROLES, SECTIONS, type RoleId } from "@/config/roles";
import { useSession } from "@/hooks/useSession";
import { sessionService, staffService, staffFullName } from "@/services";
import { Button } from "@/components/ui/Button";
import { Landscape } from "@/components/brand/Landscape";
import { RoleIcon } from "./RoleIcon";
import { TenantLogo } from "./TenantLogo";
import { ViewSwitch } from "./ViewSwitch";

/** Экран входа в МИС: выбор роли карточками и демо-вход без пароля */
export function MisLogin() {
  const router = useRouter();
  const s = useSession();
  const [picked, setPicked] = useState<RoleId | null>(null);
  const roleId = picked ?? s.role?.id ?? null;
  const role = ROLES.find((r) => r.id === roleId);
  const user = role ? staffService.demoUser(role.id) : undefined;
  const sanatorium = s.tenant.sanatoriums.find((x) => x.id === user?.sanatoriumId);

  const enter = (id: RoleId) => {
    sessionService.signIn(id);
    router.push(SECTIONS[ROLES.find((r) => r.id === id)!.start].href);
  };

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[minmax(360px,0.8fr)_1.2fr]">
      {/* бренд-панель */}
      <aside className="relative overflow-hidden bg-forest-deep px-6 py-8 text-milk sm:px-10 lg:flex lg:flex-col lg:justify-between lg:py-12">
        <Landscape className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" />
        <div className="relative">
          <TenantLogo tenant={s.tenant} light subtitle="Для сотрудников" />
          <h1 className="font-display mt-10 text-[36px] leading-[1.05] sm:text-[48px] lg:mt-16">
            Медицинская информационная система
          </h1>
          <p className="mt-4 max-w-md text-[16px] leading-relaxed text-sage">
            Приём, назначения, процедуры, размещение и питание гостей — в одном окне для всей сети.
          </p>
        </div>
        <ul className="relative mt-8 hidden space-y-2.5 text-[14px] text-sage lg:block">
          {s.tenant.sanatoriums.map((x) => (
            <li key={x.id} className="flex items-center gap-2.5">
              <MapPin size={15} className="shrink-0 text-gold" />
              <span className="text-milk">{x.kind === "spa" ? x.title.replace("СПА-клуб Ревиталь ", "СПА-клуб ") : x.title.replace(/ \d★$/, "")}</span>
              <span className="text-sage/70">· {x.kind === "spa" ? "СПА-клуб" : `${x.stars}★`}</span>
            </li>
          ))}
        </ul>
      </aside>

      {/* выбор роли */}
      <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-10 lg:py-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal">Вход в систему</div>
          <ViewSwitch current="staff" />
        </div>
        <h2 className="font-display mt-4 text-[34px] leading-tight text-forest-deep sm:text-[44px]">Кто вы сегодня?</h2>
        <p className="mt-2 text-[16px] text-muted">Выберите роль — от неё зависят меню и первый экран.</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {ROLES.map((r, i) => {
            const active = r.id === roleId;
            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setPicked(r.id)}
                onDoubleClick={() => enter(r.id)}
                aria-pressed={active}
                className={`surface surface-hover relative flex min-h-[88px] items-start gap-4 rounded-3xl p-4 text-left sm:p-5 ${
                  active ? "!border-forest/60 ring-2 ring-forest/15" : ""
                }`}
              >
                <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${active ? "bg-forest text-milk" : "bg-sage-soft text-forest"}`}>
                  <RoleIcon icon={r.icon} size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block text-[16px] font-semibold leading-snug text-forest-deep">{r.title}</span>
                  <span className="mt-1 block text-[14px] leading-snug text-muted">{r.line}</span>
                </span>
                {active && (
                  <span className="absolute right-4 top-4 grid h-6 w-6 place-items-center rounded-full bg-forest text-milk">
                    <Check size={14} />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="sticky bottom-0 -mx-4 mt-6 border-t border-line bg-milk/95 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:rounded-3xl sm:border sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-[14px] leading-snug text-muted">
              {user && role ? (
                <>
                  Вы войдёте как <span className="font-medium text-forest-deep">{staffFullName(user)}</span>
                  <br />
                  {user.position}
                  {sanatorium && role.id !== "manager" && role.id !== "sysadmin" && role.id !== "marketer" ? `, ${sanatorium.title}` : ", вся сеть"}
                </>
              ) : (
                "Выберите роль, чтобы войти"
              )}
            </div>
            <Button size="lg" disabled={!role} onClick={() => role && enter(role.id)} className="w-full sm:w-auto">
              Войти <ArrowRight size={18} />
            </Button>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 text-[13.5px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <KeyRound size={15} className="shrink-0 text-teal" /> Демо-вход без пароля. В рабочей версии — пароль и код из приложения.
          </span>
          {/* Скрытый демо-переключатель: как система выглядит у другой сети санаториев */}
          <button
            onClick={() => sessionService.setTenant(s.tenant.id === "revital" ? "demo" : "revital")}
            className="inline-flex items-center gap-1.5 self-start text-muted/80 underline-offset-4 hover:text-forest hover:underline"
          >
            <Palette size={14} />
            {s.tenant.id === "revital" ? "Как это выглядит для другого санатория" : "Вернуть стиль Ревиталь"}
          </button>
        </div>
      </main>
    </div>
  );
}
