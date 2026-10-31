"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { db } from "@/mock/db";
import { sessionService } from "@/services";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { DemoNavigator } from "./DemoNavigator";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Рабочие разделы для сотрудников — со своей оболочкой, без шапки сайта
  const admin = pathname.startsWith("/admin") || pathname.startsWith("/mis");

  useEffect(() => {
    db.hydrate();
    sessionService.hydrate();
  }, []);

  return (
    <>
      {!admin && <SiteHeader />}
      <main className="flex-1">{children}</main>
      {!admin && <SiteFooter />}
      <DemoNavigator />
    </>
  );
}
