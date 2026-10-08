"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { db } from "@/mock/db";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { DemoNavigator } from "./DemoNavigator";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const admin = pathname.startsWith("/admin");

  useEffect(() => {
    db.hydrate();
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
