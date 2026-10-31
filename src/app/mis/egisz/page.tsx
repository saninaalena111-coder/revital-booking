import type { Metadata } from "next";
import { Egisz } from "@/components/mis/egisz/Egisz";

export const metadata: Metadata = { title: "ЕГИСЗ и документы — МИС Ревиталь" };

export default function Page() {
  return <Egisz />;
}
