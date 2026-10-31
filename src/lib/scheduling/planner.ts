/**
 * Раскладка курса процедур по расписанию гостя.
 *
 * Врач назначает процедуру, количество и частоту — система сама подбирает дни и время так,
 * чтобы ОДНОВРЕМЕННО:
 *   1) гость проживает в санатории в этот день (в день выезда процедуры не ставятся);
 *   2) кабинет работает и в нём есть свободное место (ванна, кушетка, аппарат);
 *   3) гость свободен: нет другой процедуры или приёма врача, есть время дойти;
 *   4) время не попадает на завтрак, обед или ужин гостя;
 *   5) в день не больше пяти процедур — чтобы не перегружать гостя.
 *
 * Модуль чистый, как и engine.ts: не знает, откуда пришли данные.
 */
import type {
  Frequency, ISODate, MedRoom, Minutes, PlanConflict, Procedure, ProcedureSession,
} from "@/lib/types";
import { addDays, fmtDay, fmtTime, overlaps, toMin } from "@/lib/time";

/** Время питания гостя: процедуры на него не назначаются */
export const GUEST_MEALS = [
  { title: "завтрак", start: toMin("08:00"), end: toMin("09:00") },
  { title: "обед", start: toMin("13:00"), end: toMin("14:00") },
  { title: "ужин", start: toMin("18:00"), end: toMin("19:00") },
];

/** Минут на переход между корпусами и кабинетами */
export const GAP_MIN = 10;
export const MAX_PER_DAY = 5;
const STEP = 10;

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  daily: "ежедневно",
  every_other_day: "через день",
  twice_week: "2 раза в неделю",
  once: "однократно",
};

const FREQUENCY_STEP: Record<Frequency, number> = { daily: 1, every_other_day: 2, twice_week: 3, once: 1 };

export interface Interval {
  date: ISODate;
  start: Minutes;
  end: Minutes;
}

export interface PlanContext {
  procedures: Procedure[];
  rooms: MedRoom[];
  /** Все сеансы санатория — по ним считается загрузка кабинетов */
  sessions: ProcedureSession[];
  /** Другие дела гостя: приёмы врачей */
  guestBusy: Interval[];
  stay: { from: ISODate; to: ISODate };
  /** Раньше этого дня ничего не планируем */
  today: ISODate;
  /** В этот день — не раньше этого времени (например, «сейчас» при переносе) */
  notBefore?: Minutes;
}

export interface PlanRequest {
  patientId: string;
  procedureId: string;
  total: number;
  frequency: Frequency;
  from: ISODate;
}

export type PlannedSession = Omit<ProcedureSession, "id" | "prescriptionId">;

export interface PlanResult {
  sessions: PlannedSession[];
  conflicts: PlanConflict[];
  /** Короткое объяснение для врача */
  summary: string;
}

const active = (s: { status: string }) => s.status !== "cancelled";

/** Индекс занятости: быстро отвечает, сколько гостей в кабинете и занят ли гость */
function buildIndex(ctx: PlanContext, patientId: string) {
  const byRoom = new Map<string, Interval[]>();
  const guest = new Map<ISODate, Interval[]>();
  const push = (m: Map<string, Interval[]>, k: string, v: Interval) => {
    const list = m.get(k);
    if (list) list.push(v);
    else m.set(k, [v]);
  };
  for (const s of ctx.sessions) {
    if (!active(s)) continue;
    push(byRoom, `${s.roomId}|${s.date}`, s);
    if (s.patientId === patientId) push(guest, s.date, s);
  }
  for (const b of ctx.guestBusy) push(guest, b.date, b);
  return {
    roomLoad: (roomId: string, date: ISODate, start: Minutes, end: Minutes) =>
      (byRoom.get(`${roomId}|${date}`) ?? []).filter((s) => overlaps(start, end, s.start, s.end)).length,
    guestBusy: (date: ISODate, start: Minutes, end: Minutes) =>
      (guest.get(date) ?? []).find((s) => overlaps(start - GAP_MIN, end + GAP_MIN, s.start, s.end)),
    guestCount: (date: ISODate) => (guest.get(date) ?? []).length,
    add(roomId: string, s: Interval) {
      push(byRoom, `${roomId}|${s.date}`, s);
      push(guest, s.date, s);
    },
  };
}

type DayFail = "room_full" | "guest_busy" | "meal" | "max";

/** Подбор времени в конкретный день. Сначала — то же время, что вчера: гостю удобнее постоянный распорядок. */
function fitDay(
  idx: ReturnType<typeof buildIndex>, procedure: Procedure, rooms: MedRoom[], date: ISODate, preferred: Minutes | null, notBefore = 0,
): { roomId: string; start: Minutes } | DayFail {
  if (idx.guestCount(date) >= MAX_PER_DAY) return "max";
  let reason: DayFail = "room_full";
  for (const room of rooms) {
    const times: Minutes[] = [];
    if (preferred !== null) times.push(preferred);
    for (let t = room.open; t + procedure.durationMin <= room.close; t += STEP) if (t !== preferred) times.push(t);
    for (const start of times) {
      const end = start + procedure.durationMin;
      if (start < room.open || start < notBefore || end > room.close) continue;
      if (GUEST_MEALS.some((m) => overlaps(start, end, m.start, m.end))) {
        if (reason === "room_full") reason = "meal";
        continue;
      }
      if (idx.guestBusy(date, start, end)) {
        reason = "guest_busy";
        continue;
      }
      if (idx.roomLoad(room.id, date, start, end) >= room.capacity) continue;
      return { roomId: room.id, start };
    }
  }
  return reason;
}

export function planCourse(ctx: PlanContext, req: PlanRequest): PlanResult {
  const procedure = ctx.procedures.find((p) => p.id === req.procedureId)!;
  const rooms = ctx.rooms.filter((r) => procedure.roomIds.includes(r.id));
  const idx = buildIndex(ctx, req.patientId);
  const lastDay = addDays(ctx.stay.to, -1);
  const total = req.frequency === "once" ? 1 : req.total;
  const step = FREQUENCY_STEP[req.frequency];

  let day = [req.from, ctx.stay.from, ctx.today].sort().at(-1)!;
  let preferred: Minutes | null = null;
  const sessions: PlannedSession[] = [];
  const shifted: string[] = [];

  while (sessions.length < total && day <= lastDay) {
    const fit = fitDay(idx, procedure, rooms, day, preferred, day === ctx.today ? ctx.notBefore : 0);
    if (typeof fit === "string") {
      const why = {
        room_full: `кабинет «${rooms[0]?.title}» занят весь день`,
        guest_busy: "у гостя нет свободного окна между другими процедурами",
        meal: "свободное время попадает только на питание гостя",
        max: `у гостя уже ${MAX_PER_DAY} процедур`,
      }[fit];
      shifted.push(`${fmtDay(day)}: ${why} — сеанс перенесён на следующий день`);
      day = addDays(day, 1);
      continue;
    }
    const end = fit.start + procedure.durationMin;
    sessions.push({
      patientId: req.patientId, procedureId: procedure.id, roomId: fit.roomId,
      date: day, start: fit.start, end, status: "planned",
    });
    idx.add(fit.roomId, { date: day, start: fit.start, end });
    preferred = fit.start;
    day = addDays(day, step);
  }

  const conflicts: PlanConflict[] = shifted.slice(0, 3).map((text) => ({ kind: "room_full" as const, text }));
  if (sessions.length < total) {
    conflicts.unshift({
      kind: "no_days",
      text: `Не хватает дней проживания: поместилось ${sessions.length} из ${total}. Гость выезжает ${fmtDay(ctx.stay.to)} — уменьшите количество или назначьте чаще.`,
    });
  }

  const first = sessions[0];
  const summary = !sessions.length
    ? "Не удалось найти ни одного свободного времени до выезда гостя."
    : `${sessions.length} ${plural(sessions.length, "сеанс", "сеанса", "сеансов")} с ${fmtDay(first.date)} по ${fmtDay(sessions.at(-1)!.date)}, обычно в ${fmtTime(first.start)}`;

  return { sessions, conflicts, summary };
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
