/**
 * MOCK-ДАННЫЕ: существующие записи в МИС.
 *
 * 12 октября (DEMO_TODAY) расписано вручную — на этом дне построены
 * все примеры из раздела «Как система принимает решение».
 * Остальные дни заполняются детерминированным генератором.
 *
 * В рабочей версии записи приходят из МИС «Санаториум»
 * (GET /appointments?date=…) и обновляются по событиям webhook.
 */
import type { Appointment, Attribution, ISODate } from "@/lib/types";
import { DEMO_TODAY, toMin, weekday } from "@/lib/time";
import { DOCTORS, ROOMS, SERVICES } from "./catalog";
import { checkSlot, doctorDayStatus } from "@/lib/scheduling/engine";

export const ANNA_APPOINTMENT_ID = "a-anna-1011";

const visit = (
  id: string, doctorId: string, serviceId: string, roomId: string,
  start: string, end: string, patientName: string, extra: Partial<Appointment> = {},
): Appointment => ({
  id, misId: `SAN-APP-${id.slice(2).toUpperCase()}`, patientId: null, patientName,
  doctorId, serviceId, roomId, date: DEMO_TODAY,
  start: toMin(start), end: toMin(end), status: "confirmed", kind: "visit",
  createdVia: "mis", createdAt: "2026-10-09T10:00:00", ...extra,
});

const IG_GYN: Attribution = {
  source: "Instagram", medium: "Видео врача", campaign: "Гинекология после 35", material: "Видео врача",
  utm_source: "instagram", utm_medium: "reels", utm_campaign: "gyn_after_35",
  landing_page: "/booking?direction=gynecology", referrer: "instagram.com",
};

/** Ручной сценарий дня 12 октября + история пациентки Анны Смирновой */
export const HANDCRAFTED: Appointment[] = [
  // Мария Ивановна Орлова — смена 09:00–17:00, основной кабинет №201
  visit("a-o1", "orlova", "ther-primary", "201", "09:00", "09:30", "Ковалёва Н."),
  visit("a-o2", "orlova", "ther-primary", "201", "09:30", "10:00", "Тарасов Д."),
  visit("a-o3", "orlova", "ther-repeat", "201", "10:00", "10:30", "Мельникова Е."),
  // Пример №1: запись Анны в №305 на 11:00 (на экране «Логика» её можно «снять» и создать заново)
  visit(ANNA_APPOINTMENT_ID, "orlova", "cosm-hardware", "305", "11:00", "12:00", "Смирнова А.", {
    patientId: "p-anna", createdVia: "online", createdAt: "2026-10-09T19:42:00",
    attribution: {
      source: "Сайт", medium: "Страница косметологии", campaign: "Осенний уход",
      utm_source: "site", utm_medium: "button", utm_campaign: "autumn_care",
      landing_page: "/cosmetology", referrer: "revitalpark.ru",
    },
  }),
  visit("a-o5", "orlova", "cosm-consult", "201", "13:30", "14:00", "Яковлева Т."),
  // Пример №3: №410 занят Марией Ивановной в 15:00
  visit("a-o6", "orlova", "cosm-care", "410", "15:00", "16:00", "Новикова И."),

  // Зинаида Петровна Волкова — смена 09:00–16:00
  {
    id: "a-v0", patientId: null, patientName: "—", doctorId: "volkova", serviceId: null, roomId: null,
    date: DEMO_TODAY, start: toMin("09:00"), end: toMin("12:00"), status: "confirmed", kind: "block",
    note: "Обход гостей санатория", createdVia: "mis", createdAt: "2026-10-01T09:00:00",
  },
  // Пример №2: Волкова в №307 в 13:00
  visit("a-v2", "volkova", "physio-hardware", "307", "13:00", "14:00", "Захаров П."),

  // Ирина Андреевна Белова — без основного кабинета
  visit("a-b1", "belova", "physio-hardware", "411", "09:30", "10:30", "Фёдорова Л."),
  // Пример №1: №307 занят в 11:00
  visit("a-b2", "belova", "physio-hardware", "307", "11:00", "12:00", "Лебедев С."),
  // Пример №3: №412 занят Ириной Андреевной в 15:00
  visit("a-b3", "belova", "rehab", "412", "15:00", "16:00", "Кузнецова О."),

  // Алексей Сергеевич Морозов — смена 14:00–19:00
  visit("a-m1", "morozov", "neuro-consult", "214", "14:00", "14:30", "Попов А."),
  visit("a-m2", "morozov", "neuro-consult", "214", "14:30", "15:00", "Соловьёва М."),

  // Елена Викторовна Соколова — №305 используется несколькими врачами
  visit("a-s1", "sokolova", "gyn-consult", "320", "10:00", "10:30", "Григорьева В.", { createdVia: "online", attribution: IG_GYN }),
  visit("a-s2", "sokolova", "gyn-us", "321", "11:00", "11:30", "Орехова К.", { createdVia: "online", attribution: IG_GYN }),
  visit("a-s3", "sokolova", "gyn-consult", "305", "12:00", "12:30", "Белякова Ю."),

  // Ольга Николаевна Лебедева
  visit("a-l1", "lebedeva", "psy-consult", "418", "12:00", "13:00", "Миронова А."),

  // История посещений Анны Смирновой (гость санатория, номер 315)
  {
    ...visit("a-anna-h1", "orlova", "ther-primary", "201", "10:30", "11:00", "Смирнова А."),
    date: "2026-10-08", status: "completed", patientId: "p-anna",
  },
  {
    ...visit("a-anna-h2", "belova", "physio-hardware", "411", "16:00", "17:00", "Смирнова А."),
    date: "2026-10-09", status: "completed", patientId: "p-anna",
  },
  {
    ...visit("a-anna-h3", "orlova", "cosm-consult", "201", "12:00", "12:30", "Смирнова А."),
    date: "2026-10-10", status: "completed", patientId: "p-anna",
  },
];

/* ---------- генератор занятости для остальных дней ---------- */

const NAMES = [
  "Андреева О.", "Борисов К.", "Васильева Е.", "Гусев М.", "Давыдова Л.", "Егорова С.",
  "Жукова А.", "Зайцев В.", "Ильина Т.", "Комаров Р.", "Лазарева Н.", "Максимова Д.",
  "Никитин Г.", "Осипова В.", "Павлова Ю.", "Романов И.", "Сергеева М.", "Тихонова Е.",
];

function rng(seed: string) {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

const cache = new Map<ISODate, Appointment[]>();

export function generatedFor(date: ISODate): Appointment[] {
  if (date === DEMO_TODAY) return [];
  const hit = cache.get(date);
  if (hit) return hit;
  const rand = rng(date);
  const list: Appointment[] = [];
  const ctx = { doctors: DOCTORS, rooms: ROOMS, services: SERVICES, appointments: list };
  const fill = weekday(date) === 6 ? 0.35 : 0.5;

  for (const doc of DOCTORS) {
    if (doctorDayStatus(doc, date) !== "on_shift") continue;
    for (let t = doc.shiftStart; t < doc.shiftEnd; t += 30) {
      if (rand() > fill) continue;
      const serviceId = doc.serviceIds[Math.floor(rand() * doc.serviceIds.length)];
      const c = checkSlot(ctx, doc.id, serviceId, date, t);
      if (!c.available) continue;
      list.push({
        id: `g-${date}-${doc.id}-${t}`, misId: `SAN-APP-G${t}${date.slice(-2)}`,
        patientId: null, patientName: NAMES[Math.floor(rand() * NAMES.length)],
        doctorId: doc.id, serviceId, roomId: c.assignedRoomId, date,
        start: t, end: c.end, status: "confirmed", kind: "visit",
        createdVia: rand() > 0.55 ? "online" : "mis", createdAt: `${date}T08:00:00`,
      });
    }
  }
  cache.set(date, list);
  return list;
}
