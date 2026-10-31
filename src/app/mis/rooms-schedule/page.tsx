import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Загрузка кабинетов — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Загрузка кабинетов" lead="Кто и когда занят в каждом кабинете." step="Появится вместе с модулем «Медицина»." />;
}
