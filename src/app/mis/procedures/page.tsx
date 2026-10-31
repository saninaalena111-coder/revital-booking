import type { Metadata } from "next";
import { ProcedureQueue } from "@/components/mis/medical/ProcedureQueue";

export const metadata: Metadata = { title: "Процедурный кабинет — МИС Ревиталь" };

export default function Page() {
  return <ProcedureQueue />;
}
