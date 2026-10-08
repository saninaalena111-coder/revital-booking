import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/HowTabs";
import { IntegrationContent } from "@/components/integration/IntegrationPage";

export const metadata: Metadata = { title: "Что происходит внутри системы — Онлайн-запись Ревиталь" };

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="Как это работает"
        title="Что происходит внутри системы"
        lead="«Онлайн-запись Ревиталь» — фирменный сервис записи для пациентов. Расписание, врачи и медицинские данные остаются в медицинской информационной системе (МИС) «Санаториум», а наша система автоматически обменивается с ней данными."
      />
      <IntegrationContent />
    </>
  );
}
