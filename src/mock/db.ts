/**
 * In-memory «база» демо-режима.
 *
 * Хранит то, что пользователь сделал в прототипе (созданные, перенесённые
 * и отменённые записи, СМС, настройки) и сохраняет это в localStorage,
 * чтобы личный кабинет и админ-панель видели результат записи.
 *
 * В рабочей версии этот модуль исчезает: записи живут в МИС «Санаториум»
 * и в базе Онлайн-запись Ревиталь на сервере.
 */
import type { Appointment, ISODate, SmsMessage } from "@/lib/types";
import { ANNA_APPOINTMENT_ID, HANDCRAFTED, generatedFor } from "./appointments";

/** Изменения поверх сгенерированной таблицы МИС: новые строки и правки существующих */
interface TableState {
  added: { id: string }[];
  patches: Record<string, object>;
}

interface DemoState {
  created: Appointment[];
  patches: Record<string, Partial<Appointment>>;
  sms: SmsMessage[];
  settings: { smsEnabled: boolean };
  /** Таблицы МИС: назначения, сеансы процедур, документы, проживание, питание, журнал */
  tables: Record<string, TableState>;
}

const KEY = "revital-booking-demo-v2";

const SEED_SMS: SmsMessage[] = [
  { id: "sms-1", appointmentId: ANNA_APPOINTMENT_ID, kind: "created", status: "sent", sendAt: "9 окт, 19:42",
    text: "Ревиталь Парк: Вы записаны на процедуру к Марии Ивановне Орловой 12 октября в 11:00." },
  { id: "sms-2", appointmentId: ANNA_APPOINTMENT_ID, kind: "day_before", status: "sent", sendAt: "11 окт, 11:00",
    text: "Ревиталь Парк: напоминаем о приёме завтра в 11:00." },
  { id: "sms-3", appointmentId: ANNA_APPOINTMENT_ID, kind: "two_hours", status: "scheduled", sendAt: "12 окт, 09:00",
    text: "Ревиталь Парк: ждём вас сегодня в 11:00. Если планы изменились, запись можно перенести в личном кабинете." },
];

const fresh = (): DemoState => ({ created: [], patches: {}, sms: [...SEED_SMS], settings: { smsEnabled: true }, tables: {} });

let state: DemoState = fresh();
let version = 0;
const listeners = new Set<() => void>();
const tableCache = new Map<string, { version: number; rows: { id: string }[] }>();

function emit() {
  version++;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* приватный режим — работаем без сохранения */
  }
  listeners.forEach((l) => l());
}

export const db = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getVersion: () => version,

  hydrate() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        state = { ...fresh(), ...JSON.parse(raw) };
        version++;
        listeners.forEach((l) => l());
      }
    } catch {
      /* игнорируем повреждённые данные */
    }
  },

  reset() {
    state = fresh();
    emit();
  },

  /** Записи, которые можно изменить: ручной сценарий + созданные в демо */
  touchable(): Appointment[] {
    return [...HANDCRAFTED, ...state.created].map((a) => ({ ...a, ...state.patches[a.id] }));
  },

  byDate(date: ISODate): Appointment[] {
    return [...this.touchable().filter((a) => a.date === date), ...generatedFor(date)];
  },

  find(id: string) {
    return this.touchable().find((a) => a.id === id);
  },

  insert(a: Appointment) {
    state = { ...state, created: [...state.created, a] };
    emit();
  },

  patch(id: string, p: Partial<Appointment>) {
    state = { ...state, patches: { ...state.patches, [id]: { ...state.patches[id], ...p } } };
    emit();
  },

  sms: () => state.sms,
  addSms(list: SmsMessage[]) {
    state = { ...state, sms: [...state.sms, ...list] };
    emit();
  },

  settings: () => state.settings,
  setSettings(s: Partial<DemoState["settings"]>) {
    state = { ...state, settings: { ...state.settings, ...s } };
    emit();
  },

  /**
   * Таблица МИС: сгенерированные строки (base) + добавленные в демо + правки.
   * Сгенерированное не хранится в localStorage — только то, что изменили на показе.
   */
  table<T extends { id: string }>(name: string, base: () => T[]) {
    const own = (): TableState => state.tables[name] ?? { added: [], patches: {} };
    const save = (t: TableState) => {
      state = { ...state, tables: { ...state.tables, [name]: t } };
      emit();
    };
    return {
      all(): T[] {
        const hit = tableCache.get(name);
        if (hit && hit.version === version) return hit.rows as T[];
        const t = own();
        const rows = [...base(), ...(t.added as T[])].map((r) => (t.patches[r.id] ? { ...r, ...t.patches[r.id] } : r));
        tableCache.set(name, { version, rows });
        return rows;
      },
      find(id: string): T | undefined {
        return this.all().find((r) => r.id === id);
      },
      insert(...rows: T[]) {
        const t = own();
        save({ ...t, added: [...t.added, ...rows] });
      },
      patch(id: string, p: Partial<T>) {
        const t = own();
        save({ ...t, patches: { ...t.patches, [id]: { ...t.patches[id], ...p } } });
      },
    };
  },
};
