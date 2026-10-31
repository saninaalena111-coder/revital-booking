import type { Metadata } from "next";
import { Meals } from "@/components/mis/meals/Meals";

export const metadata: Metadata = { title: "Питание — МИС Ревиталь" };

export default function Page() {
  return <Meals />;
}
