import type { Metadata } from "next";
import { PageIntro } from "@/components/ui/HowTabs";
import { RequirementsContent } from "@/components/integration/Requirements";

export const metadata: Metadata = { title: "Что потребуется для интеграции — Revital Medical Booking" };

export default function RequirementsPage() {
  return (
    <>
      <PageIntro eyebrow="Для руководства" title="Что потребуется для интеграции" lead="Четыре пункта, которые нужно обсудить с разработчиком МИС «Санаториум»." />
      <RequirementsContent />
    </>
  );
}
