import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Приём врача — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Приём врача" lead="Осмотр по шаблону специальности, диагноз и рекомендации." step="Появится вместе с модулем «Медицина»." />;
}
