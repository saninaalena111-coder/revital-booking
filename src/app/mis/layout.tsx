import { Suspense } from "react";
import type { Metadata } from "next";
import { MisShell } from "@/components/mis/MisShell";

export const metadata: Metadata = { title: "МИС Ревиталь — для сотрудников" };

export default function MisLayout({ children }: LayoutProps<"/mis">) {
  return (
    <Suspense>
      <MisShell>{children}</MisShell>
    </Suspense>
  );
}
