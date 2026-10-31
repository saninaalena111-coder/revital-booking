import type { Metadata } from "next";
import { Analytics } from "@/components/mis/analytics/Analytics";

export const metadata: Metadata = { title: "Сводная панель — МИС Ревиталь" };

export default function Page() {
  return <Analytics />;
}
