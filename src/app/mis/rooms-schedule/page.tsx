import type { Metadata } from "next";
import { RoomsLoad } from "@/components/mis/medical/RoomsLoad";

export const metadata: Metadata = { title: "Загрузка кабинетов — МИС Ревиталь" };

export default function Page() {
  return <RoomsLoad />;
}
