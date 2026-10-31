import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Процедурный кабинет — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Процедурный кабинет" lead="Очередь процедур на сегодня. Отметьте выполненные одним нажатием." step="Появится вместе с модулем «Медицина»." />;
}
