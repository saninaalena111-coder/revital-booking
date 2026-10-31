/**
 * Таблицы демо-МИС: сгенерированная база + изменения, сделанные на показе.
 *
 * Сгенерированные строки не сохраняются — их всегда можно построить заново.
 * В localStorage (через db) попадают только добавленные строки и правки,
 * поэтому «Сбросить демо-данные» возвращает базу в исходное состояние.
 */
import type {
  AuditEntry, MealOrder, MedDocument, Patient, Prescription, ProcedureSession, Stay, Visit,
} from "@/lib/types";
import { db } from "@/mock/db";
import { dataset } from "./generate";

export const tables = {
  patients: db.table<Patient>("patients", () => dataset().patients),
  stays: db.table<Stay>("stays", () => dataset().stays),
  prescriptions: db.table<Prescription>("prescriptions", () => dataset().prescriptions),
  sessions: db.table<ProcedureSession>("sessions", () => dataset().sessions),
  visits: db.table<Visit>("visits", () => dataset().visits),
  documents: db.table<MedDocument>("documents", () => dataset().documents),
  mealOrders: db.table<MealOrder>("mealOrders", () => dataset().mealOrders),
  audit: db.table<AuditEntry>("audit", () => dataset().audit),
};

/** Справочники, которые на показе не меняются */
export const hotelRooms = () => dataset().hotelRooms;
export const labs = () => dataset().labs;
