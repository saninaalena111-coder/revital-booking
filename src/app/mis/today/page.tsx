import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Мой день — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Мой день" lead="Пациенты на сегодня по времени. Нажмите «Начать приём», чтобы открыть осмотр." step="Появится вместе с модулем «Медицина»." />;
}
