import type { Metadata } from "next";
import { RecordsModule } from "@/components/mis/RecordsModule";

export const metadata: Metadata = { title: "Онлайн-запись — МИС Ревиталь" };

export default function Page() {
  return <RecordsModule />;
}
