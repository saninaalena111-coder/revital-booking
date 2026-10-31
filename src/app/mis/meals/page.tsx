import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Питание — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Питание" lead="Диетстолы гостей и заказы блюд на завтра по залам." step="Появится вместе с модулями ЕГИСЗ, размещения и питания." />;
}
