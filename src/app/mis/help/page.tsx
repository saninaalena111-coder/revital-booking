import type { Metadata } from "next";
import { Help } from "@/components/mis/help/Help";

export const metadata: Metadata = { title: "Справка — МИС Ревиталь" };

export default function Page() {
  return <Help />;
}
