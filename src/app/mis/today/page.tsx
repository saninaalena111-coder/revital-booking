import type { Metadata } from "next";
import { DoctorDay } from "@/components/mis/medical/DoctorDay";

export const metadata: Metadata = { title: "Мой день — МИС Ревиталь" };

export default function Page() {
  return <DoctorDay />;
}
