import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/HowTabs";
import { IntegrationContent } from "@/components/integration/IntegrationPage";

export const metadata: Metadata = { title: "Что происходит внутри системы — Revital Medical Booking" };

export default function HowItWorksPage() {
  return (
    <>
      <PageIntro
        eyebrow="Как это работает"
        title="Что происходит внутри системы"
        lead="Revital Medical Booking — это фирменный интерфейс записи. Расписание, врачи и медицинские данные остаются в МИС «Санаториум», а наша система обменивается с ней данными через API."
      />
      <IntegrationContent />
    </>
  );
}
