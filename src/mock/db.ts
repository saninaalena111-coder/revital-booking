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

interface DemoState {
  created: Appointment[];
  patches: Record<string, Partial<Appointment>>;
  sms: SmsMessage[];
  settings: { smsEnabled: boolean };
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

const fresh = (): DemoState => ({ created: [], patches: {}, sms: [...SEED_SMS], settings: { smsEnabled: true } });

let state: DemoState = fresh();
let version = 0;
const listeners = new Set<() => void>();

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
};
