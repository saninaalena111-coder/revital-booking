import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Администрирование — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Администрирование" lead="Пользователи и роли, журнал действий, состояние системы и интеграции." step="Появится вместе с разделом администрирования." />;
}
