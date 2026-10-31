import type { Metadata } from "next";
import { Stays } from "@/components/mis/stays/Stays";

export const metadata: Metadata = { title: "Размещение — МИС Ревиталь" };

export default function Page() {
  return <Stays />;
}
