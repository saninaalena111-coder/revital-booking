import { Suspense } from "react";
import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/HowTabs";
import { LogicExplorer } from "@/components/logic/LogicExplorer";
import { HiddenRoomPrinciple, RoomAccessDemo } from "@/components/logic/RoomRules";

export const metadata: Metadata = { title: "Как система принимает решение — Revital Medical Booking" };

export default function LogicPage() {
  return (
    <>
      <PageIntro
        eyebrow="Логика расписания"
        title="Как система принимает решение о доступном времени"
        lead="Время показывается пациенту, только если одновременно свободны врач и подходящий кабинет. Выберите пример — и посмотрите, как система проверяет каждый шаг."
      />
      <div className="mt-12">
        <Suspense>
          <LogicExplorer />
        </Suspense>
      </div>
      <RoomAccessDemo />
      <HiddenRoomPrinciple />
    </>
  );
}
