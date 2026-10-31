import type { Metadata } from "next";
import { Placeholder } from "@/components/mis/Placeholder";

export const metadata: Metadata = { title: "ЕГИСЗ и документы — МИС Ревиталь" };

export default function Page() {
  return <Placeholder title="ЕГИСЗ и документы" lead="Медицинские документы, подпись врача и отправка в ЕГИСЗ." step="Появится вместе с модулями ЕГИСЗ, размещения и питания." />;
}
