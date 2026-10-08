/**
 * integrationService — шлюз к МИС «Санаториум».
 *
 * Единственное место, которое будет знать о формате API МИС.
 * Остальные сервисы вызывают его методы и получают данные
 * в доменных типах (src/lib/types.ts).
 *
 * ЧТО ПОДКЛЮЧИТЬ В РАБОЧЕЙ ВЕРСИИ:
 *  1. HTTP-клиент с авторизацией к API МИС (серверная сторона, ключи не во frontend).
 *  2. Приём webhook: POST /api/integrations/sanatorium/events
 *     (проверка подписи → обновление записи → уведомление пациента).
 *  3. Резервная синхронизация: периодический опрос изменений,
 *     если webhook в МИС отсутствует.
 */
import { latency } from "./config";

export interface ContractItem {
  title: string;
  hint: string;
  tech: string;
  stage: 1 | 2;
}

/** Что Онлайн-запись Ревиталь получает из МИС */
const RECEIVE: ContractItem[] = [
  { title: "Список врачей и их номера", hint: "Кого показывать пациенту", tech: "GET /doctors", stage: 1 },
  { title: "Специальности", hint: "Для каталога направлений", tech: "GET /specialties", stage: 1 },
  { title: "Рабочие смены", hint: "Когда врач принимает", tech: "GET /doctors/{id}/shifts", stage: 1 },
  { title: "Услуги и их продолжительность", hint: "Сколько времени занимает приём", tech: "GET /services", stage: 1 },
  { title: "Кабинеты и привязка врачей", hint: "Где врач может работать", tech: "GET /rooms", stage: 1 },
  { title: "Существующие записи", hint: "Что уже занято", tech: "GET /appointments?date=", stage: 1 },
  { title: "Свободное время", hint: "Если «Санаториум» умеет считать его сам", tech: "GET /slots", stage: 1 },
  { title: "Данные для поиска гостя", hint: "Телефон + фамилия → бронирование", tech: "POST /patients/lookup", stage: 1 },
  { title: "Номер пациента в МИС", hint: "Связывает нашу запись с карточкой пациента в МИС", tech: "patient.id", stage: 1 },
  { title: "Номер созданной записи", hint: "Чтобы потом переносить и отменять", tech: "appointment.id", stage: 1 },
  { title: "Актуальный статус записи", hint: "Подтверждена, перенесена, отменена", tech: "GET /appointments/{id}", stage: 1 },
  { title: "Назначения врача", hint: "Какие процедуры разрешены пациенту", tech: "GET /patients/{id}/prescriptions", stage: 2 },
];

/** Что Онлайн-запись Ревиталь передаёт в МИС */
const SEND: ContractItem[] = [
  { title: "Пациент", hint: "Новый или найденный по номеру в МИС", tech: "patient", stage: 1 },
  { title: "Врач", hint: "Выбранный специалист", tech: "doctorId", stage: 1 },
  { title: "Услуга", hint: "Что будет на приёме", tech: "serviceId", stage: 1 },
  { title: "Дата и время", hint: "Выбранный пациентом слот", tech: "date, start", stage: 1 },
  { title: "Кабинет — при необходимости", hint: "Если «Санаториум» не назначает его сам", tech: "roomId", stage: 1 },
  { title: "Создание записи", hint: "Слот сразу занят и в МИС", tech: "POST /appointments", stage: 1 },
  { title: "Перенос", hint: "Из личного кабинета пациента", tech: "PATCH /appointments/{id}", stage: 1 },
  { title: "Отмена", hint: "Освобождает врача и кабинет", tech: "DELETE /appointments/{id}", stage: 1 },
];

export interface MisEvent {
  id: string;
  type: "appointment.rescheduled" | "appointment.cancelled" | "appointment.created" | "shift.changed";
  label: string;
  at: string;
  payload: Record<string, string>;
}

const EVENT_LOG: MisEvent[] = [
  { id: "ev-1", type: "appointment.created", label: "Запись создана администратором в МИС", at: "08:52", payload: { appointmentId: "SAN-APP-O5", doctor: "SAN-DOC-1042", time: "13:30" } },
  { id: "ev-2", type: "shift.changed", label: "Изменена смена врача", at: "08:40", payload: { doctor: "SAN-DOC-1063", shift: "14:00–19:00" } },
  { id: "ev-3", type: "appointment.cancelled", label: "Запись отменена по звонку", at: "08:15", payload: { appointmentId: "SAN-APP-X17" } },
];

export interface Prescription {
  id: string;
  title: string;
  prescribed: number;
  done: number;
  durationMin: number;
  note: string;
}

/**
 * ЭТАП 2 (не реализовано): пример назначений терапевта.
 * В рабочей версии — GET /patients/{id}/prescriptions из МИС.
 */
const SAMPLE_PRESCRIPTIONS: Prescription[] = [
  { id: "rx-1", title: "Массаж", prescribed: 5, done: 1, durationMin: 40, note: "Классический массаж спины" },
  { id: "rx-2", title: "Лечебная ванна", prescribed: 3, done: 0, durationMin: 20, note: "Хвойно-жемчужная" },
  { id: "rx-3", title: "Физиотерапия", prescribed: 3, done: 1, durationMin: 30, note: "Магнитотерапия" },
];

export const integrationService = {
  /** ЭТАП 2 — демо-данные, интеграция назначений не подключена */
  async samplePrescriptions(): Promise<Prescription[]> {
    await latency();
    return SAMPLE_PRESCRIPTIONS;
  },
  async contract() {
    await latency();
    return { receive: RECEIVE, send: SEND };
  },
  async syncStatus() {
    await latency();
    return {
      mode: "mock" as const,
      lastSync: "12 окт, 08:55",
      webhook: "ожидает подключения",
      pollingIntervalMin: 5,
    };
  },
  async events(): Promise<MisEvent[]> {
    await latency();
    return EVENT_LOG;
  },
};
