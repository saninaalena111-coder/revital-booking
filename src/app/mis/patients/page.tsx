import type { Metadata } from "next";
import { PatientsList } from "@/components/mis/medical/PatientsList";

export const metadata: Metadata = { title: "Гости и пациенты — МИС Ревиталь" };

export default function Page() {
  return <PatientsList />;
}
