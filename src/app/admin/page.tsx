import { Suspense } from "react";
import type { Metadata } from "next";
import { AdminShell } from "@/components/admin/AdminShell";

export const metadata: Metadata = { title: "Администратор — Revital Medical Booking" };

export default function AdminPage() {
  return (
    <Suspense>
      <AdminShell />
    </Suspense>
  );
}
