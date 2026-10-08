import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Дашборд — Онлайн-запись Ревиталь" };

export default function AdminPage() {
  return (
    <Suspense>
      <AdminShell />
    </Suspense>
  );
}
