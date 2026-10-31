import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Сводная панель — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Сводная панель" lead="Загрузка, выручка и записи по всей сети и по каждому санаторию." step="Появится вместе с панелью руководителя." />;
}
