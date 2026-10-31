import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Шахматка номеров — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Шахматка номеров" lead="Заезды и выезды сегодня, занятость номеров по дням." step="Появится вместе с модулями ЕГИСЗ, размещения и питания." />;
}
