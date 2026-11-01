import type { Metadata } from "next";
import { Reports } from "@/components/mis/reports/Reports";

export const metadata: Metadata = { title: "Отчёты и качество — МИС Ревиталь" };

export default function Page() {
  return <Reports />;
}
