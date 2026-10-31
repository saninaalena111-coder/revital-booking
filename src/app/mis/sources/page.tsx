import type { Metadata } from "next";
import { SourcesView } from "@/components/admin/AdminViews";

export const metadata: Metadata = { title: "Источники гостей — МИС Ревиталь" };

export default function Page() {
  return <SourcesView />;
}
