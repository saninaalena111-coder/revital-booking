import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Карта гостя — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Карта гостя" lead="Приёмы, назначения, расписание, документы и анализы гостя." step="Появится вместе с модулем «Медицина»." />;
}
