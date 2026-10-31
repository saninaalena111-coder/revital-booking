import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "Справка — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="Справка" lead="Короткие инструкции «Как…» по каждому разделу системы." step="Появится вместе с ИИ-помощником." />;
}
