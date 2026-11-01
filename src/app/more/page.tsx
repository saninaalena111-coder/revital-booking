import type { Metadata } from "next";
import { More } from "@/components/more/More";

export const metadata: Metadata = { title: "Не только МИС — Ревиталь" };

export default function MorePage() {
  return <More />;
}
