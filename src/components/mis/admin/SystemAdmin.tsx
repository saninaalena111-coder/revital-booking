"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Ban, Check, CheckCircle2, Code2, Database, HardDrive, KeyRound, Loader2, Lock, MailPlus, Minus, Plug, RefreshCw, Search, Server,
  ShieldAlert, ShieldCheck, Smartphone, UserCheck, type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AuditKind, RoleId, Staff } from "@/lib/types";
import { ROLES, SECTIONS, type SectionId } from "@/config/roles";
import { useService } from "@/hooks/useService";
import { useSession } from "@/hooks/useSession";
import { AUDIT_KIND_LABEL, auditService, patientFullName, patientsService, staffFullName, staffService } from "@/services";
import { DEMO_TODAY, fmtDay } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Segmented } from "@/components/ui/Segmented";
import { ComingSoonButton } from "../ComingSoon";
import { MisTitle } from "../MisShell";
import { RoleIcon } from "../RoleIcon";
import { card, Loading, StatusPill, useToast } from "../ui";

type Tab = "users" | "roles" | "audit" | "twofactor" | "system" | "integrations";

/** Администрирование: пользователи и роли, журнал действий, безопасность, серверы, интеграции */
export function SystemAdmin() {
  const [tab, setTab] = useState<Tab>("users");
  return (
    <>
      <MisTitle
        title="Администрирование"
        lead="Кто и с какими правами работает в системе, что открывал в медицинских данных, как защищён вход и в каком состоянии серверы."
        right={
          <Link href="/admin?tab=dev-exchange" className="inline-flex h-11 items-center gap-2 rounded-full border border-forest/25 px-5 text-[15px] font-medium text-forest hover:border-forest">
            <Code2 size={16} /> Для разработчиков
          </Link>
        }
      />
      <Segmented
        className="mb-6"
        value={tab}
        onChange={setTab}
        options={[
          { value: "users", label: "Пользователи" },
          { value: "roles", label: "Роли и права" },
          { value: "audit", label: "Журнал действий" },
          { value: "twofactor", label: "Вход в два шага" },
          { value: "system", label: "Состояние системы" },
          { value: "integrations", label: "Интеграции" },
        ]}
      />
      {tab === "users" && <Users />}
      {tab === "roles" && <RolesMatrix />}
      {tab === "audit" && <Audit />}
      {tab === "twofactor" && <TwoFactor />}
      {tab === "system" && <SystemStatus />}
      {tab === "integrations" && <Integrations />}
    </>
  );
}

/* ---------------- Пользователи ---------------- */

const roleTitle = (id: RoleId) => ROLES.find((r) => r.id === id)!.title;

function Users() {
  const { tenant } = useSession();
  const { data } = useService(() => staffService.list("all"), []);
  const [invited, setInvited] = useState<Staff[]>([]);
  const [blocked, setBlocked] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const [invite, setInvite] = useState(false);
  const toast = useToast();
  if (!data) return <Loading />;
  const rows = [...invited, ...data].filter((s) => !q || `${staffFullName(s)} ${s.position}`.toLowerCase().includes(q.toLowerCase()));
  const san = (id: string) => tenant.sanatoriums.find((s) => s.id === id)?.short ?? "";

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:w-80">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Сотрудник или должность" className="h-11 w-full rounded-full border border-line bg-milk pl-10 pr-4 text-[15px] outline-none focus:border-forest/50" />
        </label>
        <Button onClick={() => setInvite(true)}><MailPlus size={17} /> Пригласить сотрудника</Button>
      </div>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[760px] text-left text-[14.5px]">
          <thead className="bg-cream/60 text-[12px] uppercase tracking-wider text-muted">
            <tr>
              <th className="px-5 py-3 font-medium">Сотрудник</th>
              <th className="px-5 py-3 font-medium">Роль</th>
              <th className="px-5 py-3 font-medium">Санаторий</th>
              <th className="px-5 py-3 font-medium">Вход в два шага</th>
              <th className="px-5 py-3 font-medium">Последний вход</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((s) => {
              const off = !s.active || blocked.includes(s.id);
              const pending = invited.includes(s);
              return (
                <tr key={s.id} className={off ? "opacity-60" : ""}>
                  <td className="px-5 py-3">
                    <div className="font-medium text-forest-deep">{staffFullName(s)}</div>
                    <div className="text-[13px] text-muted">{s.position}</div>
                  </td>
                  <td className="px-5 py-3 text-ink/85">{roleTitle(s.role)}</td>
                  <td className="px-5 py-3 text-ink/85">{["manager", "marketer", "sysadmin"].includes(s.role) ? "Вся сеть" : san(s.sanatoriumId)}</td>
                  <td className="px-5 py-3">
                    {pending ? <StatusPill tone="gold">Ждёт первого входа</StatusPill> : s.twoFactor ? <StatusPill tone="ok" icon={ShieldCheck}>Включён</StatusPill> : <StatusPill tone="danger" icon={ShieldAlert}>Не включён</StatusPill>}
                  </td>
                  <td className="px-5 py-3 text-muted">{pending ? "—" : off ? "Доступ отключён" : s.lastSeen}</td>
                  <td className="px-5 py-3 text-right">
                    {!pending && (
                      <button
                        onClick={() => {
                          setBlocked((b) => (b.includes(s.id) ? b.filter((x) => x !== s.id) : [...b, s.id]));
                          toast.show(off ? `Доступ восстановлен: ${s.lastName}` : `Доступ отключён: ${s.lastName}`);
                        }}
                        className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-[13.5px] text-muted hover:bg-cream hover:text-forest"
                      >
                        {off ? <><UserCheck size={15} /> Вернуть доступ</> : <><Ban size={15} /> Отключить</>}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-muted">Когда сотрудник увольняется, доступ отключается одной кнопкой — история его действий остаётся в журнале.</p>
      <InviteModal
        open={invite}
        onClose={() => setInvite(false)}
        onInvite={(s) => {
          setInvited((list) => [s, ...list]);
          toast.show(`Приглашение отправлено на ${s.email} (демо)`);
        }}
      />
      {toast.node}
    </>
  );
}

function InviteModal({ open, onClose, onInvite }: { open: boolean; onClose: () => void; onInvite: (s: Staff) => void }) {
  const { tenant } = useSession();
  const [fio, setFio] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RoleId>("doctor");
  const [san, setSan] = useState(tenant.primary);
  const ok = fio.trim().split(/\s+/).length >= 2 && /.+@.+\..+/.test(email);
  const input = "mt-1.5 h-12 w-full rounded-2xl border border-line bg-white px-4 text-[15px] outline-none focus:border-forest/50";
  return (
    <Modal open={open} onClose={onClose} title="Пригласить сотрудника">
      <div className="space-y-4">
        <label className="block"><span className="text-[14px] font-medium text-forest-deep">ФИО</span><input value={fio} onChange={(e) => setFio(e.target.value)} placeholder="Фамилия Имя Отчество" className={input} /></label>
        <label className="block"><span className="text-[14px] font-medium text-forest-deep">Рабочая почта</span><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@revital.demo" type="email" className={input} /></label>
        <label className="block">
          <span className="text-[14px] font-medium text-forest-deep">Роль</span>
          <select value={role} onChange={(e) => setRole(e.target.value as RoleId)} className={input}>
            {ROLES.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-[14px] font-medium text-forest-deep">Санаторий</span>
          <select value={san} onChange={(e) => setSan(e.target.value as typeof san)} className={input}>
            {tenant.sanatoriums.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </select>
        </label>
        <p className="text-[13px] text-muted">Сотрудник получит письмо со ссылкой, задаст пароль и подключит приложение для входа в два шага.</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Отмена</Button>
          <Button
            disabled={!ok}
            onClick={() => {
              const [lastName, firstName, patronymic = ""] = fio.trim().split(/\s+/);
              onInvite({ id: `inv-${email}`, sanatoriumId: san, role, lastName, firstName, patronymic, position: roleTitle(role), email, lastSeen: "—", twoFactor: false, active: true });
              setFio("");
              setEmail("");
              onClose();
            }}
          >
            <MailPlus size={16} /> Отправить приглашение
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------------- Роли и права ---------------- */

function RolesMatrix() {
  const sections = (Object.keys(SECTIONS) as SectionId[]).filter((id) => id !== "help");
  return (
    <>
      <p className="mb-4 max-w-3xl text-[15px] text-muted">
        Принцип минимального доступа: каждая роль видит только то, что нужно для работы. Разделы с медицинскими данными отмечены замком — маркетолог и ресторан их не видят.
      </p>
      <div className={`${card} overflow-x-auto`}>
        <table className="w-full min-w-[900px] text-[14px]">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-3 text-left text-[12px] font-medium uppercase tracking-wider text-muted">Раздел</th>
              {ROLES.map((r) => (
                <th key={r.id} className="px-2 py-3 text-center align-bottom">
                  <span className="mx-auto mb-1 grid h-8 w-8 place-items-center rounded-full bg-sage-soft text-forest"><RoleIcon icon={r.icon} size={16} /></span>
                  <span className="block text-[11.5px] font-medium leading-tight text-ink/80">{r.title}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {sections.map((id) => (
              <tr key={id}>
                <td className="px-4 py-2.5 font-medium text-forest-deep">
                  <span className="flex items-center gap-2">{SECTIONS[id].title} {SECTIONS[id].medical && <Lock size={13} className="text-danger" aria-label="медицинские данные" />}</span>
                </td>
                {ROLES.map((r) => (
                  <td key={r.id} className="px-2 py-2.5 text-center">
                    {r.menu.includes(id) ? (
                      <Check size={18} className="mx-auto text-ok" aria-label="есть доступ" />
                    ) : (
                      <Minus size={16} className="mx-auto text-line" aria-label="нет доступа" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[13px] text-muted">В рабочей версии права настраиваются здесь же: можно создать свою роль, например «Старшая медсестра».</p>
    </>
  );
}

/* ---------------- Журнал действий ---------------- */

type AuditFilter = "all" | "medical" | "login" | "denied";

function Audit() {
  const [filter, setFilter] = useState<AuditFilter>("medical");
  const { data } = useService(async () => {
    const [entries, patients] = await Promise.all([auditService.list(), patientsService.list()]);
    return { entries, patients };
  }, []);
  const tone: Record<AuditKind, "ok" | "wait" | "info" | "danger" | "muted" | "gold"> = { login: "muted", view: "info", edit: "wait", sign: "ok", send: "ok", denied: "danger", export: "gold" };
  if (!data) return <Loading />;
  const rows = data.entries.filter((e) =>
    filter === "all" ? true : filter === "medical" ? !!e.patientId : filter === "login" ? e.kind === "login" : e.kind === "denied",
  );
  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Segmented size="sm" value={filter} onChange={setFilter} options={[
          { value: "medical", label: "Медицинские данные" },
          { value: "all", label: "Все действия" },
          { value: "login", label: "Входы" },
          { value: "denied", label: "Отказы в доступе" },
        ]} />
        <span className="text-[13.5px] text-muted">Сегодня, {fmtDay(DEMO_TODAY)} · записей: {rows.length}</span>
      </div>
      <ul className={`${card} divide-y divide-line`}>
        {rows.map((e) => {
          const s = staffService.byId(e.staffId);
          const p = e.patientId ? data.patients.find((x) => x.id === e.patientId) : undefined;
          return (
            <motion.li key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-1.5 p-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <span className="w-14 shrink-0 text-[15px] font-semibold tabular-nums text-forest-deep">{e.at.slice(11, 16)}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] text-ink">{e.action}{p && <> · <Link href={`/mis/patient?id=${p.id}`} className="font-medium text-forest-deep hover:underline">{patientFullName(p)}</Link></>}</span>
                <span className="block text-[13px] text-muted">{s ? `${staffFullName(s)} · ${s.position}` : e.staffId}</span>
              </span>
              <StatusPill tone={tone[e.kind]}>{AUDIT_KIND_LABEL[e.kind]}</StatusPill>
            </motion.li>
          );
        })}
      </ul>
      <p className="mt-3 text-[13px] text-muted">Журнал ведёт сервер: его нельзя изменить или удалить из интерфейса. Так требует закон о персональных данных и порядок работы с медицинской тайной.</p>
    </>
  );
}

/* ---------------- Вход в два шага (демо-экран) ---------------- */

const DEMO_CODE = "284619";

function TwoFactor() {
  const [step, setStep] = useState<"password" | "code" | "done">("password");
  const [code, setCode] = useState("");
  const [left, setLeft] = useState(30);
  const wrong = code.length === 6 && code !== DEMO_CODE;

  useEffect(() => {
    if (step !== "code") return;
    const t = setInterval(() => setLeft((s) => (s <= 1 ? 30 : s - 1)), 1000);
    return () => clearInterval(t);
  }, [step]);

  return (
    <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
      <div className={`${card} p-6 sm:p-8`}>
        {step === "password" && (
          <>
            <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-teal"><KeyRound size={15} /> Шаг 1 из 2</div>
            <h3 className="font-display mt-2 text-[30px] text-forest-deep">Вход в систему</h3>
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-line bg-white px-4 py-3 text-[15px] text-ink/80">orlova@revital.demo</div>
              <div className="rounded-2xl border border-line bg-white px-4 py-3 text-[15px] tracking-[0.3em] text-ink/60">••••••••••</div>
            </div>
            <Button className="mt-5 w-full" size="lg" onClick={() => { setStep("code"); setLeft(30); }}>Далее</Button>
            <p className="mt-3 text-center text-[12.5px] text-muted">Демо-экран: логин и пароль уже введены.</p>
          </>
        )}
        {step === "code" && (
          <>
            <div className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.16em] text-teal"><Smartphone size={15} /> Шаг 2 из 2</div>
            <h3 className="font-display mt-2 text-[30px] leading-tight text-forest-deep">Код из приложения</h3>
            <p className="mt-1 text-[15px] text-muted">Откройте приложение-аутентификатор на телефоне и введите шесть цифр.</p>
            <input
              value={code}
              onChange={(e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(v);
                if (v === DEMO_CODE) setTimeout(() => setStep("done"), 400);
              }}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="Код из приложения"
              placeholder="000000"
              className={`mt-5 h-16 w-full rounded-2xl border bg-white text-center text-[30px] tracking-[0.4em] outline-none ${wrong ? "border-danger" : "border-line focus:border-forest/50"}`}
            />
            {wrong && <p className="mt-2 text-[14px] text-danger">Код не подошёл. Проверьте цифры в приложении.</p>}
            <div className="mt-4 flex items-center justify-between rounded-2xl bg-cream px-4 py-3 text-[14px]">
              <span className="text-muted">Демо-код: <b className="tracking-widest text-forest-deep">{DEMO_CODE.slice(0, 3)} {DEMO_CODE.slice(3)}</b></span>
              <span className="tabular-nums text-muted">обновится через {left} с</span>
            </div>
          </>
        )}
        {step === "done" && (
          <div className="py-6 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-ok-soft text-ok"><CheckCircle2 size={34} /></span>
            <div className="font-display mt-4 text-[28px] text-forest-deep">Вход подтверждён</div>
            <p className="mt-1 text-[15px] text-muted">Событие записано в журнал действий.</p>
            <Button variant="secondary" className="mt-5" onClick={() => { setStep("password"); setCode(""); }}>Показать ещё раз</Button>
          </div>
        )}
      </div>
      <div className={`${card} p-6`}>
        <h3 className="text-[18px] font-semibold text-forest-deep">Зачем второй шаг</h3>
        <ul className="mt-3 space-y-3 text-[15px] text-ink/85">
          {[
            "Даже если пароль узнали, без телефона сотрудника войти нельзя.",
            "Код меняется каждые 30 секунд — его бесполезно записывать или пересылать.",
            "Работает без интернета на телефоне: приложение считает код само.",
            "Администратор видит, у кого второй шаг не включён, и напоминает.",
          ].map((t) => <li key={t} className="flex gap-2"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-ok" /> {t}</li>)}
        </ul>
      </div>
    </div>
  );
}

/* ---------------- Состояние системы ---------------- */

function SystemStatus() {
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState<string | null>(null);
  const backups = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ day: i === 0 ? "Сегодня" : i === 1 ? "Вчера" : `${12 - i} октября`, size: `${(18.4 - i * 0.07).toFixed(1).replace(".", ",")} ГБ` })), []);
  const tiles: { icon: LucideIcon; title: string; status: string; lines: string[] }[] = [
    { icon: Server, title: "Сервер приложения", status: "Работает", lines: ["Загрузка процессора 23%", "Без перерывов 41 день", "Размещён в России"] },
    { icon: Database, title: "База данных", status: "Работает", lines: ["Размер 18,4 ГБ", "Резервная реплика синхронизирована", "Шифрование данных включено"] },
    { icon: HardDrive, title: "Резервная копия", status: "В порядке", lines: ["Последняя копия сегодня 03:00", "Проверка восстановления — успешно", "Хранятся 30 дней в другом дата-центре"] },
  ];
  return (
    <>
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.title} className={`${card} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-[16px] font-semibold text-forest-deep"><t.icon size={19} className="text-teal" /> {t.title}</span>
              <StatusPill tone="ok" icon={CheckCircle2}>{t.status}</StatusPill>
            </div>
            <ul className="mt-3 space-y-1 text-[14.5px] text-ink/80">{t.lines.map((l) => <li key={l}>{l}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className={`${card} p-5`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-[17px] font-semibold text-forest-deep">Резервные копии за неделю</h3>
          <Button
            variant="secondary"
            disabled={checking}
            onClick={() => {
              setChecking(true);
              setTimeout(() => { setChecking(false); setChecked("Восстановление из копии сегодня 03:00 проверено на тестовом сервере — данные полные, 4 мин 12 с."); }, 2200);
            }}
          >
            {checking ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />} {checking ? "Проверяем…" : "Проверить восстановление"}
          </Button>
        </div>
        {checked && <p className="mt-3 flex gap-2 rounded-2xl bg-ok-soft p-3 text-[14px] text-ok"><CheckCircle2 size={17} className="mt-0.5 shrink-0" /> {checked}</p>}
        <ul className="mt-4 divide-y divide-line">
          {backups.map((b) => (
            <li key={b.day} className="flex items-center justify-between py-2.5 text-[14.5px]">
              <span className="text-ink/85">{b.day}, 03:00</span>
              <span className="flex items-center gap-3 text-muted">{b.size} <StatusPill tone="ok" icon={Check}>Проверена</StatusPill></span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ---------------- Интеграции ---------------- */

function Integrations() {
  const toast = useToast();
  const list: { title: string; text: string; state: "on" | "plan" | "demo"; feature?: "onec" }[] = [
    { title: "N3.Health → ЕГИСЗ", text: "Отправка подписанных медицинских документов в РЭМД. Сегодня отправлено 12 документов, последний — в 10:31.", state: "on" },
    { title: "СМС-шлюз", text: "Подтверждения записей и напоминания гостям. Доставлено 98,6% сообщений за неделю.", state: "on" },
    { title: "Сайт и онлайн-запись", text: "Записи с сайта и из личного кабинета приходят в расписание врачей сразу.", state: "on" },
    { title: "Распознавание речи", text: "В рабочей версии — Yandex SpeechKit на сервере компании. В прототипе — распознавание браузера.", state: "demo" },
    { title: "1С:Бухгалтерия", text: "Передача оплат, услуг и актов.", state: "plan", feature: "onec" },
  ];
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {list.map((i) => (
        <div key={i.title} className={`${card} flex flex-col p-5`}>
          <div className="flex items-start justify-between gap-3">
            <span className="flex items-center gap-2 text-[16px] font-semibold text-forest-deep"><Plug size={18} className="text-teal" /> {i.title}</span>
            {i.state === "on" ? <StatusPill tone="ok" icon={CheckCircle2}>Подключено</StatusPill> : i.state === "demo" ? <StatusPill tone="info">Демо-режим</StatusPill> : <StatusPill tone="gold">Этап 3</StatusPill>}
          </div>
          <p className="mt-2 flex-1 text-[14.5px] text-ink/80">{i.text}</p>
          <div className="mt-4">
            {i.feature ? (
              <ComingSoonButton feature={i.feature} size="sm">Подробнее</ComingSoonButton>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => toast.show(`${i.title}: связь в порядке, ответ за 120 мс`)}>
                <RefreshCw size={15} /> Проверить связь
              </Button>
            )}
          </div>
        </div>
      ))}
      {toast.node}
    </div>
  );
}
