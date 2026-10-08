import type { ISODate, Minutes } from "./types";

/** «Сегодня» в демо-сценарии: понедельник, 12 октября 2026 */
export const DEMO_TODAY: ISODate = "2026-10-12";

export const toMin = (hhmm: string): Minutes => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

export const fmtTime = (min: Minutes): string =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export const fmtRange = (a: Minutes, b: Minutes) => `${fmtTime(a)}–${fmtTime(b)}`;

export const parseDate = (d: ISODate): Date => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day);
};

export const toISO = (date: Date): ISODate =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const addDays = (d: ISODate, n: number): ISODate => {
  const date = parseDate(d);
  date.setDate(date.getDate() + n);
  return toISO(date);
};

export const daysBetween = (from: ISODate, to: ISODate): ISODate[] => {
  const out: ISODate[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
};

/** 1 — пн … 7 — вс */
export const weekday = (d: ISODate) => {
  const w = parseDate(d).getDay();
  return w === 0 ? 7 : w;
};

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];
const WEEKDAYS_SHORT = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
const WEEKDAYS_LONG = ["понедельник", "вторник", "среда", "четверг", "пятница", "суббота", "воскресенье"];

export const fmtDay = (d: ISODate) => {
  const date = parseDate(d);
  return `${date.getDate()} ${MONTHS_GEN[date.getMonth()]}`;
};
export const fmtWeekdayShort = (d: ISODate) => WEEKDAYS_SHORT[weekday(d) - 1];
export const fmtWeekdayLong = (d: ISODate) => WEEKDAYS_LONG[weekday(d) - 1];
export const dayNum = (d: ISODate) => parseDate(d).getDate();

export const overlaps = (a1: Minutes, a2: Minutes, b1: Minutes, b2: Minutes) => a1 < b2 && b1 < a2;

export const relativeDay = (d: ISODate) => {
  if (d === DEMO_TODAY) return "сегодня";
  if (d === addDays(DEMO_TODAY, 1)) return "завтра";
  return fmtDay(d);
};

export const WORKDAY_START = toMin("09:00");
export const WORKDAY_END = toMin("19:00");
