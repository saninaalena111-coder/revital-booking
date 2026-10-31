"use client";

import { useSyncExternalStore } from "react";
import { roleById } from "@/config/roles";
import { tenantById } from "@/config/tenant";
import { sessionService, staffService } from "@/services";

/** Текущая сессия МИС: роль, сотрудник, санаторий и арендатор */
export function useSession() {
  const s = useSyncExternalStore(sessionService.subscribe, sessionService.snapshot, sessionService.serverSnapshot);
  const tenant = tenantById(s.tenantId);
  return {
    ...s,
    tenant,
    role: s.role ? roleById(s.role) : null,
    user: staffService.byId(s.staffId),
    sanatorium: s.sanatoriumId === "all" ? null : tenant.sanatoriums.find((x) => x.id === s.sanatoriumId) ?? null,
  };
}
