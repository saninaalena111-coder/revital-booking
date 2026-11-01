/**
 * catalogService — справочники МИС: процедуры, кабинеты, программы, диетстолы, блюда, МКБ-10.
 *
 * РЕАЛЬНЫЙ API: справочники хранятся в нашей базе и редактируются администратором;
 * МКБ-10 и справочники ЕГИСЗ синхронизируются с НСИ Минздрава.
 */
import type { Diagnosis, DietTable, Dish, MedRoom, Procedure, ProcedureCategory, Program, SanatoriumId } from "@/lib/types";
import { DIET_TABLES, DISHES, ICD10, MED_ROOMS, PROCEDURES, PROGRAMS } from "@/mock/mis/catalog";
import { REVITAL } from "@/config/tenant";

export const CATEGORY_LABEL: Record<ProcedureCategory, string> = {
  bath: "Ванны",
  shower: "Души",
  physio: "Физиотерапия",
  massage: "Массаж",
  ayurveda: "Аюрведа",
  mud: "Грязи и обёртывания",
  climate: "Климатотерапия",
  inhalation: "Ингаляции и фитотерапия",
  injection: "Процедурный кабинет",
  fitness: "Движение",
  diagnostics: "Диагностика",
  cosmetology: "Косметология",
  other: "Сауна и флоатинг",
};

/** Справочники нужны синхронно — экраны строят из них подписи без задержки */
export const catalogService = {
  procedures: (): Procedure[] => PROCEDURES,
  procedure: (id: string) => PROCEDURES.find((p) => p.id === id)!,
  /** Кабинеты медицинского центра объекта (у двух санаториев Геленджика центр общий) */
  medRooms: (sanatoriumId: SanatoriumId | "all" = "gelendzhik"): MedRoom[] => {
    const center = sanatoriumId === "all" ? "all" : REVITAL.sanatoriums.find((s) => s.id === sanatoriumId)?.medCenter ?? sanatoriumId;
    return MED_ROOMS.filter((r) => center === "all" || r.sanatoriumId === center);
  },
  medRoom: (id: string) => MED_ROOMS.find((r) => r.id === id)!,
  programs: (): Program[] => PROGRAMS,
  program: (id: string) => PROGRAMS.find((p) => p.id === id)!,
  dietTables: (): DietTable[] => DIET_TABLES,
  dietTable: (id: string) => DIET_TABLES.find((t) => t.id === id)!,
  dishes: (): Dish[] => DISHES,
  dish: (id: string) => DISHES.find((d) => d.id === id)!,

  /** Поиск по МКБ-10: код или слова названия в любом порядке */
  icdSearch(q: string, limit = 8): Diagnosis[] {
    const words = q.toLowerCase().replace(",", ".").split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    return ICD10.filter((d) => {
      const hay = `${d.code} ${d.title}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    }).slice(0, limit);
  },
};
