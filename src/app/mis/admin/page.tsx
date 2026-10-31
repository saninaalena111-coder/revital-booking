import type { Metadata } from "next";
import { SystemAdmin } from "@/components/mis/admin/SystemAdmin";

export const metadata: Metadata = { title: "Администрирование — МИС Ревиталь" };

export default function Page() {
  return <SystemAdmin />;
}
