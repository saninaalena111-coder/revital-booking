import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Гости и пациенты — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Гости и пациенты" lead="Все гости санатория: проживающие, будущие и амбулаторные." step="Появится вместе с модулем «Медицина»." />;
}
