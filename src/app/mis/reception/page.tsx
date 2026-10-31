import type { Metadata } from "next";
import { Reception } from "@/components/mis/medical/Reception";

export const metadata: Metadata = { title: "Приём врача — МИС Ревиталь" };

export default function Page() {
  return <Reception />;
}
