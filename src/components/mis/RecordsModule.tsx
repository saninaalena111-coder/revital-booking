"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AdminCalendar } from "@/components/admin/AdminCalendar";
import { DoctorsView, RoomsView, SmsView } from "@/components/admin/AdminViews";
import { Segmented } from "@/components/ui/Segmented";
import { DEMO_TODAY } from "@/lib/time";
import { MisTitle } from "./MisShell";

const TABS = [
  { value: "calendar", label: "Календарь записей" },
  { value: "doctors", label: "Врачи и смены" },
  { value: "rooms", label: "Кабинеты" },
  { value: "sms", label: "СМС-напоминания" },
] as const;

type Tab = (typeof TABS)[number]["value"];

/** Модуль «Запись» внутри МИС: экраны онлайн-записи для сотрудников */
export function RecordsModule() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = (TABS.find((t) => t.value === params.get("tab"))?.value ?? "calendar") as Tab;

  return (
    <>
      <MisTitle
        title="Онлайн-запись"
        lead="Записи с сайта, из личного кабинета и по телефону. Запись гостя сразу попадает в расписание врача и в карту гостя."
      />
      <Segmented
        className="mb-8"
        value={tab}
        onChange={(v) => router.replace(`/mis/booking?tab=${v}`, { scroll: false })}
        options={[...TABS]}
      />
      {tab === "calendar" && <AdminCalendar initialDate={params.get("date") ?? DEMO_TODAY} />}
      {tab === "doctors" && <DoctorsView />}
      {tab === "rooms" && <RoomsView />}
      {tab === "sms" && <SmsView />}
    </>
  );
}
