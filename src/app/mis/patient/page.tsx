import type { Metadata } from "next";
import { PatientCard } from "@/components/mis/medical/PatientCard";

export const metadata: Metadata = { title: "Карта гостя — МИС Ревиталь" };

export default function Page() {
  return <PatientCard />;
}
