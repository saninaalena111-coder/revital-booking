/**
 * auditService — журнал действий с медицинскими данными: кто, когда, что открыл или изменил.
 *
 * РЕАЛЬНЫЙ API: журнал пишет сервер при каждом обращении к данным — его нельзя
 * отключить или изменить из интерфейса. GET /audit?from&to&staffId&patientId
 */
import type { AuditEntry, AuditKind } from "@/lib/types";
import { tables } from "@/mock/mis/store";
import { session } from "@/mock/session";
import { DEMO_TODAY, DEMO_NOW, fmtTime } from "@/lib/time";
import { latency, uid } from "./config";

/** Время в демо идёт от 10:40: каждое новое действие — на минуту позже предыдущего */
let tick = 0;

export const AUDIT_KIND_LABEL: Record<AuditKind, string> = {
  login: "Вход",
  view: "Просмотр",
  edit: "Изменение",
  sign: "Подпись",
  send: "Отправка",
  denied: "Отказ в доступе",
  export: "Выгрузка",
};

export const auditService = {
  async list(): Promise<AuditEntry[]> {
    await latency();
    return [...tables.audit.all()].sort((a, b) => b.at.localeCompare(a.at));
  },

  /** Записать действие текущего сотрудника. Вызывается из сервисов и экранов МИС. */
  log(kind: AuditKind, action: string, patientId?: string) {
    const staffId = session.get().staffId;
    if (!staffId) return;
    tables.audit.insert({ id: uid("au"), at: `${DEMO_TODAY}T${fmtTime(DEMO_NOW + ++tick)}:00`, staffId, kind, action, patientId });
  },
};
