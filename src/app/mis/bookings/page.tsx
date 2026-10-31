import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Брони и путёвки — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Брони и путёвки" lead="Брони гостей, программы и оплата." step="Появится вместе с модулями ЕГИСЗ, размещения и питания." />;
}
