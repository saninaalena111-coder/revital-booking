import { Suspense } from "react";
import type { Metadata } from "next";
import { Cabinet } from "@/components/cabinet/Cabinet";

export const metadata: Metadata = { title: "Личный кабинет — Ревиталь Парк" };

export default function CabinetPage() {
  return (
    <Suspense>
      <Cabinet />
    </Suspense>
  );
}
