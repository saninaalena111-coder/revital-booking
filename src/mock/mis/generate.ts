/**
 * Генератор демо-базы МИС. Все люди, телефоны и документы вымышлены.
 *
 * Детерминированный: фиксированный seed, без Math.random — каждый запуск одинаков.
 * Состав:
 *   • 100 пациентов: ~70 гостей с проживанием, 20 будущих гостей, 10 амбулаторных;
 *   • номерной фонд всех объектов сети с загрузкой ~75 % на месяц вперёд;
 *   • у гостей — первичный приём, курс процедур по расписанию, документы, анализы, питание.
 *
 * Пациенты из ручного сценария 12 октября (Анна Смирнова, Ковалёва Н., Тарасов Д. и др.)
 * заданы явно — они связаны с записями онлайн-записи и с примерами на экране «Логика».
 */
import type {
  AuditEntry, HotelRoom, ISODate, LabResult, MealOrder, MedDocument, Patient, PaymentStatus, Prescription,
  ProcedureSession, SanatoriumId, Stay, Visit, Diagnosis, Frequency,
} from "@/lib/types";
import { REVITAL } from "@/config/tenant";
import { addDays, DEMO_NOW, DEMO_TODAY, fmtDay, fmtTime, nightsBetween, toMin } from "@/lib/time";
import { planCourse, type Interval } from "@/lib/scheduling/planner";
import { stayPrice } from "@/lib/pricing";
import { HANDCRAFTED } from "@/mock/appointments";
import { DIET_TABLES, DISHES, ICD10, MED_ROOMS, PROCEDURES, PROGRAMS } from "./catalog";
import { rng, type Rng } from "./random";

const TODAY = DEMO_TODAY;

/* ================= Имена ================= */

const F_NAMES = ["Анна", "Елена", "Ольга", "Наталья", "Татьяна", "Ирина", "Светлана", "Марина", "Юлия", "Екатерина", "Галина", "Людмила", "Вера", "Надежда", "Валентина", "Лариса", "Оксана", "Дарья", "Ксения", "Полина", "Виктория", "Маргарита", "Нина", "Тамара"];
const M_NAMES = ["Александр", "Сергей", "Андрей", "Дмитрий", "Алексей", "Михаил", "Владимир", "Николай", "Игорь", "Павел", "Евгений", "Виктор", "Олег", "Юрий", "Константин", "Роман", "Артём", "Василий", "Геннадий", "Борис"];
const FATHERS = [["Александрович", "Александровна"], ["Сергеевич", "Сергеевна"], ["Андреевич", "Андреевна"], ["Дмитриевич", "Дмитриевна"], ["Алексеевич", "Алексеевна"], ["Михайлович", "Михайловна"], ["Владимирович", "Владимировна"], ["Николаевич", "Николаевна"], ["Игоревич", "Игоревна"], ["Павлович", "Павловна"], ["Евгеньевич", "Евгеньевна"], ["Викторович", "Викторовна"], ["Олегович", "Олеговна"], ["Юрьевич", "Юрьевна"], ["Петрович", "Петровна"], ["Иванович", "Ивановна"]] as const;
const SURNAMES = [
  "Алексеев", "Беляев", "Громов", "Дорофеев", "Ермаков", "Жданов", "Зуев", "Исаев", "Калинин", "Ларионов",
  "Назаров", "Овчинников", "Панов", "Рыбаков", "Савин", "Уваров", "Фомин", "Харитонов", "Цветков", "Чернов",
  "Шилов", "Щербаков", "Юдин", "Яшин", "Афанасьев", "Блинов", "Воробьёв", "Денисов", "Ефремов", "Журавлёв",
  "Зимин", "Ильин", "Кудрявцев", "Лукин", "Носков", "Пахомов", "Родионов", "Соболев", "Трофимов", "Устинов",
  "Фролов", "Хохлов", "Чистяков", "Шаров", "Ширяев", "Абрамов", "Быков", "Власов", "Голубев", "Дьяконов",
  "Егоров", "Зотов", "Лаврентьев", "Мухин", "Никифоров", "Осипов", "Прохоров", "Рожков", "Селезнёв", "Тихомиров",
  "Ушаков", "Фадеев", "Чайкин", "Шубин", "Анисимов", "Бобров", "Вешняков", "Гордеев", "Дементьев", "Евдокимов",
  "Жуков", "Кондратьев", "Логинов", "Маслов", "Нестеров", "Одинцов", "Потапов", "Рябинин", "Сазонов", "Титов",
  "Фёдоров", "Худяков", "Шестопалов", "Шмелёв",
];
const CITIES = ["Москва", "Краснодар", "Ростов-на-Дону", "Санкт-Петербург", "Екатеринбург", "Самара", "Воронеж", "Казань", "Новороссийск", "Ставрополь", "Нижний Новгород", "Тюмень"];

const female = (surname: string) => (surname.endsWith("ий") ? `${surname.slice(0, -2)}ая` : `${surname}а`);

/* ================= Шаблоны медицинских текстов ================= */

interface Profile {
  complaints: string[];
  anamnesis: string;
  diagnoses: string[];
  table: string;
}

const PROFILES: Record<string, Profile[]> = {
  base: [
    { complaints: ["Повышенная утомляемость к концу дня", "Периодические головные боли"], anamnesis: "Артериальная гипертензия около 5 лет, принимает назначенные препараты.", diagnoses: ["I10"], table: "t10" },
    { complaints: ["Боль в шейном отделе позвоночника при долгой работе за компьютером"], anamnesis: "Сидячая работа, обострения 2–3 раза в год.", diagnoses: ["M42.1", "M54.2"], table: "t15" },
    { complaints: ["Жалоб активно не предъявляет, цель — профилактика"], anamnesis: "Хронических заболеваний не отмечает.", diagnoses: ["Z00.0"], table: "t15" },
  ],
  detox: [
    { complaints: ["Избыточный вес", "Тяжесть после еды", "Отёки к вечеру"], anamnesis: "Набор веса около 10 кг за последние 3 года.", diagnoses: ["E66.0", "K76.0"], table: "t8" },
    { complaints: ["Вздутие живота", "Снижение энергии"], anamnesis: "Нерегулярное питание, стресс на работе.", diagnoses: ["K58.9", "E66.0"], table: "t8" },
  ],
  antistress: [
    { complaints: ["Трудно заснуть", "Частые ночные пробуждения", "Тревожность"], anamnesis: "Нарушения сна около года на фоне высокой нагрузки.", diagnoses: ["G47.0", "F48.0"], table: "t15" },
    { complaints: ["Головная боль к вечеру", "Раздражительность"], anamnesis: "Работа с высоким уровнем ответственности.", diagnoses: ["G44.2", "Z73.0"], table: "t15" },
  ],
  msk: [
    { complaints: ["Боль в пояснице при наклонах", "Скованность по утрам"], anamnesis: "Остеохондроз поясничного отдела, последнее обострение весной.", diagnoses: ["M42.1", "M54.5"], table: "t15" },
    { complaints: ["Боль в коленных суставах при ходьбе по лестнице"], anamnesis: "Гонартроз 2 стадии, лечится амбулаторно.", diagnoses: ["M17.0"], table: "t15" },
  ],
  covid: [
    { complaints: ["Одышка при подъёме по лестнице", "Слабость", "Снижение выносливости"], anamnesis: "Перенесённая коронавирусная инфекция 3 месяца назад.", diagnoses: ["U09.9", "R53"], table: "t15" },
  ],
  aqua: [
    { complaints: ["Усталость", "Желание восстановить силы"], anamnesis: "Хронических заболеваний не отмечает, сезонная усталость.", diagnoses: ["Z73.0"], table: "t15" },
    { complaints: ["Сухость и снижение тонуса кожи"], anamnesis: "Наблюдается у косметолога по месту жительства.", diagnoses: ["L57.4", "Z73.0"], table: "t15" },
  ],
  rest: [{ complaints: [], anamnesis: "", diagnoses: ["Z00.0"], table: "t15" }],
};

const OBJECTIVE = (rand: Rng) =>
  `Состояние удовлетворительное. АД ${rand.int(112, 148)}/${rand.int(70, 92)} мм рт. ст., пульс ${rand.int(62, 84)} в минуту, ритмичный. ` +
  `Дыхание везикулярное, хрипов нет. Живот мягкий, безболезненный. Отёков нет.`;

const RECOMMENDATIONS: Record<string, string> = {
  base: "Процедуры по назначению. Ходьба по терренкуру ежедневно. Контроль давления утром и вечером.",
  detox: "Детокс-питание по столу №8. Питьевой режим 2 литра воды в день. Процедуры по назначению.",
  antistress: "Режим сна: отход ко сну до 23:00. Ограничить экраны вечером. Процедуры по назначению.",
  msk: "Избегать подъёма тяжестей. Лечебная гимнастика ежедневно. Процедуры по назначению.",
  covid: "Дыхательная гимнастика 3 раза в день. Постепенное увеличение нагрузки. Процедуры по назначению.",
  aqua: "Питьевой режим. Процедуры по назначению. Прогулки по парку.",
  rest: "",
};

const icd = (code: string): Diagnosis => ICD10.find((d) => d.code === code)!;

/* ================= Номерной фонд ================= */

function hotelRooms(): HotelRoom[] {
  const out: HotelRoom[] = [];
  for (const san of REVITAL.sanatoriums) {
    const byBuilding = new Map<string, typeof san.roomTypes>();
    for (const t of san.roomTypes) {
      const b = t.building ?? san.buildings[0];
      byBuilding.set(b, [...(byBuilding.get(b) ?? []), t]);
    }
    for (const [building, types] of byBuilding) {
      const prefix = san.id === "gelendzhik" ? `${building.replace(/\D/g, "")}-` : "";
      let i = 0;
      for (const t of types) {
        for (let k = 0; k < t.count; k++, i++) {
          const floor = Math.floor(i / 16) + 1;
          const number = `${prefix}${floor}${String((i % 16) + 1).padStart(2, "0")}`;
          out.push({ id: `${san.id}-${number}`, sanatoriumId: san.id, number, building, floor, typeId: t.id });
        }
      }
    }
  }
  // На ремонте — по одному-два номера
  for (const id of ["gelendzhik-2-214", "gelendzhik-4-410", "sochi-312", "balashikha-207"]) {
    const r = out.find((x) => x.id === id);
    if (r) r.repair = true;
  }
  return out;
}

/** Занятость номеров: не даём заселить двоих в один номер на одни даты */
class Occupancy {
  private map = new Map<string, { from: ISODate; to: ISODate }[]>();
  free(roomId: string, from: ISODate, to: ISODate) {
    return !(this.map.get(roomId) ?? []).some((s) => from < s.to && s.from < to);
  }
  add(roomId: string, from: ISODate, to: ISODate) {
    this.map.set(roomId, [...(this.map.get(roomId) ?? []), { from, to }]);
  }
  nextBusy(roomId: string, after: ISODate): ISODate | null {
    const next = (this.map.get(roomId) ?? []).filter((s) => s.from >= after).sort((a, b) => a.from.localeCompare(b.from))[0];
    return next?.from ?? null;
  }
  busyAt(roomId: string, date: ISODate) {
    return (this.map.get(roomId) ?? []).find((s) => s.from <= date && date < s.to);
  }
}

/** Статус брони на демо-«сегодня»: заезд сегодня — ещё не заселён, выезд сегодня — ещё проживает */
const stayStatus = (from: ISODate, to: ISODate): Stay["status"] =>
  to < TODAY ? "checked_out" : from >= TODAY ? "booked" : "checked_in";

/* ================= Пациенты из ручного сценария ================= */

interface Fixed {
  id: string;
  fio: string;
  sex: "f" | "m";
  type: Patient["type"];
  birth: ISODate;
  /** Проживание: заезд, ночей, номер (необязательно), программа */
  stay?: { from: ISODate; nights: number; room?: string; program: string };
  allergies?: string[];
  /** Первичный приём ещё не проведён — сценарий врача на сегодня */
  awaitingPrimary?: boolean;
}

const FIXED: Fixed[] = [
  { id: "p-anna", fio: "Смирнова Анна Сергеевна", sex: "f", type: "guest", birth: "1988-04-17", stay: { from: "2026-10-08", nights: 7, room: "gelendzhik-4-315", program: "base" }, allergies: ["Йод"] },
  { id: "p-kovaleva", fio: "Ковалёва Наталья Петровна", sex: "f", type: "guest", birth: "1967-09-02", stay: { from: "2026-10-11", nights: 10, program: "msk" }, awaitingPrimary: true },
  { id: "p-tarasov", fio: "Тарасов Дмитрий Андреевич", sex: "m", type: "guest", birth: "1975-01-23", stay: { from: "2026-10-11", nights: 14, program: "covid" }, awaitingPrimary: true },
  { id: "p-melnikova", fio: "Мельникова Елена Викторовна", sex: "f", type: "guest", birth: "1979-06-11", stay: { from: "2026-10-05", nights: 12, program: "detox" } },
  { id: "p-yakovleva", fio: "Яковлева Татьяна Олеговна", sex: "f", type: "guest", birth: "1984-12-05", stay: { from: "2026-10-09", nights: 7, program: "aqua" } },
  { id: "p-novikova", fio: "Новикова Ирина Павловна", sex: "f", type: "guest", birth: "1970-03-28", stay: { from: "2026-10-07", nights: 10, program: "aqua" } },
  { id: "p-zakharov", fio: "Захаров Пётр Ильич", sex: "m", type: "guest", birth: "1958-08-14", stay: { from: "2026-10-03", nights: 14, program: "msk" } },
  { id: "p-fedorova", fio: "Фёдорова Людмила Ивановна", sex: "f", type: "guest", birth: "1962-11-30", stay: { from: "2026-10-06", nights: 10, program: "base" }, allergies: ["Новокаин"] },
  { id: "p-lebedev", fio: "Лебедев Сергей Николаевич", sex: "m", type: "guest", birth: "1969-02-19", stay: { from: "2026-10-08", nights: 12, program: "msk" } },
  { id: "p-kuznetsova", fio: "Кузнецова Ольга Михайловна", sex: "f", type: "guest", birth: "1973-07-07", stay: { from: "2026-10-04", nights: 14, program: "covid" } },
  { id: "p-solovyova", fio: "Соловьёва Марина Юрьевна", sex: "f", type: "guest", birth: "1986-05-21", stay: { from: "2026-10-10", nights: 7, program: "antistress" } },
  { id: "p-popov", fio: "Попов Андрей Викторович", sex: "m", type: "outpatient", birth: "1981-10-09" },
  { id: "p-grigorieva", fio: "Григорьева Вера Алексеевна", sex: "f", type: "outpatient", birth: "1987-01-15" },
  { id: "p-orekhova", fio: "Орехова Ксения Дмитриевна", sex: "f", type: "outpatient", birth: "1990-08-03" },
  { id: "p-mironova", fio: "Миронова Алла Геннадьевна", sex: "f", type: "outpatient", birth: "1977-04-25" },
  { id: "p-belyakova", fio: "Белякова Юлия Романовна", sex: "f", type: "outpatient", birth: "1983-09-12" },
];

/** Сколько пациентов каждого типа добавляет генератор к ручным */
const GENERATED = { guest: 59, future_guest: 20, outpatient: 5 };

/* ================= Генерация ================= */

export interface Dataset {
  patients: Patient[];
  hotelRooms: HotelRoom[];
  stays: Stay[];
  prescriptions: Prescription[];
  sessions: ProcedureSession[];
  visits: Visit[];
  documents: MedDocument[];
  labs: LabResult[];
  mealOrders: MealOrder[];
  audit: AuditEntry[];
}

let cached: Dataset | null = null;

/** Демо-база строится один раз при первом обращении */
export function dataset(): Dataset {
  return (cached ??= build());
}

function build(): Dataset {
  const r = rng("revital-mis-2026");
  const rooms = hotelRooms();
  const occ = new Occupancy();
  for (const room of rooms) if (room.repair) occ.add(room.id, "2000-01-01", "2100-01-01");

  const patients: Patient[] = [];
  const stays: Stay[] = [];
  const program = (id: string) => PROGRAMS.find((p) => p.id === id)!;
  const PROGRAM_WEIGHTS = [["base", 30], ["msk", 20], ["antistress", 15], ["detox", 12], ["covid", 10], ["aqua", 13]] as const;
  const SOURCES = [["Сайт", 30], ["Отдел бронирования", 25], ["Повторный гость", 15], ["Туроператор", 12], ["Яндекс Директ", 8], ["Telegram", 5], ["Instagram", 5]] as const;

  // Два санатория Геленджика: гости обоих лечатся в общем медицинском центре на Маячной
  const gelRooms = rooms.filter((x) => (x.sanatoriumId === "gelendzhik" || x.sanatoriumId === "gelendzhik5") && !x.repair);
  const placeStay = (
    sanatoriumId: SanatoriumId, patientId: string | null, guestName: string, from: ISODate, nights: number, programId: string,
    preferRoom?: string, guests = 1,
  ): Stay | null => {
    const to = addDays(from, nights);
    const pool = rooms.filter((x) => x.sanatoriumId === sanatoriumId && !x.repair);
    const candidates = preferRoom ? [pool.find((x) => x.id === preferRoom)!, ...r.shuffle(pool)] : r.shuffle(pool);
    const room = candidates.find((x) => occ.free(x.id, from, to));
    if (!room) return null;
    occ.add(room.id, from, to);
    const cfg = REVITAL.sanatoriums.find((x) => x.id === room.sanatoriumId)!;
    const roomPrice = cfg.roomTypes.find((t) => t.id === room.typeId)!.priceRub;
    const price = stayPrice(roomPrice, program(programId).pricePerNightRub, nights, guests);
    const status = stayStatus(from, to);
    const payment: PaymentStatus = status === "booked" ? r.weighted([["paid", 4], ["partial", 4], ["unpaid", 2]]) : r.chance(0.9) ? "paid" : "partial";
    const stay: Stay = {
      id: `st-${room.id}-${from}`,
      sanatoriumId, patientId, guestName, hotelRoomId: room.id, from, to, guests, programId, status, payment,
      amountRub: price, paidRub: payment === "paid" ? price : payment === "partial" ? Math.round(price * 0.3 / 100) * 100 : 0,
      source: r.weighted(SOURCES), createdAt: addDays(from, -r.int(7, 60)),
    };
    stays.push(stay);
    return stay;
  };

  const shortName = (p: Patient) => `${p.lastName} ${p.firstName[0]}. ${p.patronymic?.[0] ?? ""}.`;
  const phone = () => `+7 (900) ${r.int(500, 599)}-${String(r.int(10, 99))}-${String(r.int(10, 99))}`;
  const passport = () => `•••• ••${r.int(1000, 9999)}`;

  const makePatient = (
    id: string, last: string, first: string, patronymic: string, sex: "f" | "m", type: Patient["type"], birthDate: ISODate,
    allergies: string[],
  ): Patient => ({
    id, misId: `SAN-PAT-${60000 + patients.length * 37}`, lastName: last, firstName: first, patronymic, sex, type, birthDate,
    phone: phone(), city: r.pick(CITIES), sanatoriumId: "gelendzhik", allergies, passport: passport(),
  });

  const attachStay = (p: Patient, stay: Stay) => {
    const room = rooms.find((x) => x.id === stay.hotelRoomId)!;
    p.stayId = stay.id;
    p.programId = stay.programId;
    p.sanatoriumId = stay.sanatoriumId;
    const title = REVITAL.sanatoriums.find((x) => x.id === stay.sanatoriumId)!.title;
    p.stay = { building: `${title}, ${room.building.toLowerCase()}`, roomNumber: room.number, from: stay.from, to: stay.to };
  };

  /* --- 1. Ручные пациенты --- */
  const awaiting = new Set<string>();
  for (const f of FIXED) {
    const [last, first, patr] = f.fio.split(" ");
    const p = makePatient(f.id, last, first, patr, f.sex, f.type, f.birth, f.allergies ?? []);
    if (f.id === "p-anna") p.phone = "+7 (900) 123-45-67";
    patients.push(p);
    if (f.stay) attachStay(p, placeStay("gelendzhik", p.id, shortName(p), f.stay.from, f.stay.nights, f.stay.program, f.stay.room)!);
    if (f.awaitingPrimary) awaiting.add(f.id);
  }

  /* --- 2. Сгенерированные пациенты --- */
  const used = new Set(patients.map((p) => p.lastName.replace(/а$/, "")));
  const surnames = r.shuffle(SURNAMES.filter((s) => !used.has(s)));
  let n = 0;
  const nextPerson = () => {
    const sex: "f" | "m" = r.chance(0.6) ? "f" : "m";
    const base = surnames[n++ % surnames.length];
    const [pm, pf] = r.pick(FATHERS);
    return {
      last: sex === "f" ? female(base) : base, first: sex === "f" ? r.pick(F_NAMES) : r.pick(M_NAMES),
      patr: sex === "f" ? pf : pm, sex, birth: `${r.int(1952, 1996)}-${String(r.int(1, 12)).padStart(2, "0")}-${String(r.int(1, 28)).padStart(2, "0")}`,
    };
  };
  const allergy = () => (r.chance(0.18) ? [r.pick(["Пенициллин", "Йод", "Новокаин", "Пыльца берёзы", "Цитрусовые"])] : []);

  for (const type of ["guest", "future_guest", "outpatient"] as const) {
    for (let i = 0; i < GENERATED[type]; i++) {
      const x = nextPerson();
      const p = makePatient(`p-${String(patients.length + 1).padStart(3, "0")}`, x.last, x.first, x.patr, x.sex, type, x.birth, allergy());
      patients.push(p);
      if (type === "outpatient") continue;
      const programId = r.weighted(PROGRAM_WEIGHTS);
      const nights = Math.max(program(programId).minNights, r.pick([7, 10, 10, 12, 14, 14, 21]));
      let from: ISODate;
      if (type === "future_guest") from = addDays(TODAY, r.int(1, 28));
      else if (i < 5) from = TODAY; // заезды сегодня
      else if (i < 9) from = addDays(TODAY, -nights); // выезды сегодня
      else from = addDays(TODAY, -r.int(1, nights - 1));
      // Примерно каждый шестой гость живёт в пятизвёздочном санатории
      const san: SanatoriumId = i % 6 === 3 ? "gelendzhik5" : "gelendzhik";
      const stay = placeStay(san, p.id, shortName(p), from, nights, programId, undefined, r.chance(0.35) ? 2 : 1);
      if (stay) attachStay(p, stay);
      // Гости, заехавшие сегодня, ещё не прошли первичный приём
      if (from === TODAY) awaiting.add(p.id);
    }
  }

  /* --- 3. Остальные брони (без медицинской карты) до загрузки ~75 % --- */
  const fillRooms = (sanatoriumId: SanatoriumId, gapChance: number) => {
    for (const room of r.shuffle(rooms.filter((x) => x.sanatoriumId === sanatoriumId && !x.repair))) {
      let cursor = addDays(TODAY, -r.int(18, 24));
      const end = addDays(TODAY, 45);
      while (cursor < end) {
        const busy = occ.busyAt(room.id, cursor);
        if (busy) {
          cursor = busy.to;
          continue;
        }
        if (r.chance(gapChance)) {
          cursor = addDays(cursor, r.int(2, 6));
          continue;
        }
        const next = occ.nextBusy(room.id, cursor);
        let nights = r.pick([5, 7, 7, 10, 10, 12, 14]);
        if (next) nights = Math.min(nights, nightsBetween(cursor, next));
        if (nights < 3) {
          cursor = next!;
          continue;
        }
        const x = nextPerson();
        const programId = r.chance(0.3) ? "rest" : r.weighted(PROGRAM_WEIGHTS);
        placeStay(sanatoriumId, null, `${x.last} ${x.first[0]}. ${x.patr[0]}.`, cursor, nights, programId, room.id, r.chance(0.5) ? 2 : 1);
        cursor = addDays(cursor, nights);
      }
    }
  };
  fillRooms("gelendzhik", 0.45);
  fillRooms("sochi", 0.4);
  fillRooms("balashikha", 0.42);
  fillRooms("gelendzhik5", 0.4);

  /* --- 4. Приёмы, назначения и расписание процедур --- */
  const visits: Visit[] = [];
  const prescriptions: Prescription[] = [];
  const sessions: ProcedureSession[] = [];
  const documents: MedDocument[] = [];
  const labs: LabResult[] = [];

  // Занятость гостей приёмами врачей из ручного сценария
  const busyOf = (patientId: string): Interval[] =>
    HANDCRAFTED.filter((a) => a.patientId === patientId && a.status !== "cancelled").map((a) => ({ date: a.date, start: a.start, end: a.end }));

  const protocolBody = (v: Visit) => [
    { heading: "Жалобы", text: v.complaints },
    { heading: "Анамнез", text: v.anamnesis },
    { heading: "Объективно", text: v.objective },
    { heading: "Диагноз", text: v.diagnoses.map((d) => `${d.code} — ${d.title}`).join("; ") },
    { heading: "Рекомендации", text: v.recommendations },
  ];

  let docSeq = 0;
  const docStatus = (date: ISODate): Pick<MedDocument, "status" | "remdId" | "errorText"> => {
    const age = nightsBetween(date, TODAY);
    if (age <= 0) return { status: r.chance(0.5) ? "draft" : "signed" };
    if (age === 1) return r.weighted([[{ status: "signed" }, 3], [{ status: "sent" }, 3], [{ status: "draft" }, 1]] as const);
    if (++docSeq % 14 === 0) {
      return {
        status: "error",
        errorText: r.pick([
          "РЭМД вернул отказ: в карте гостя не указан СНИЛС. Заполните СНИЛС и отправьте документ снова.",
          "РЭМД вернул отказ: код диагноза не найден в справочнике МКБ-10. Проверьте диагноз и отправьте снова.",
        ]),
      };
    }
    return { status: "registered", remdId: `РЭМД-${r.int(1000000, 9999999)}` };
  };

  let visitSeq = 0;
  const therapists = ["orlova", "volkova"];

  for (const p of patients) {
    const stay = stays.find((s) => s.id === p.stayId);
    const programId = p.programId ?? "base";
    // У Анны — профиль под её сценарий: шея и спина, общий стол
    const profile = p.id === "p-anna" ? PROFILES.base[1] : r.pick(PROFILES[programId] ?? PROFILES.base);
    p.dietTableId = profile.table;
    p.chronic = profile.diagnoses.filter((c) => c !== "Z00.0" && c !== "Z73.0").map((c) => icd(c).title);

    // Будущие гости и те, кто ждёт первичного приёма, — без назначений
    if (p.type === "future_guest" || awaiting.has(p.id)) continue;

    // Первичный приём
    const isAnna = p.id === "p-anna";
    const visitDate = isAnna ? "2026-10-08" : stay ? stay.from : addDays(TODAY, -r.int(1, 20));
    const doctorId = p.type === "outpatient" ? r.pick(["morozov", "sokolova", "orlova", "volkova"]) : therapists[visitSeq % 2];
    const visit: Visit = {
      id: `v-${p.id}-1`, patientId: p.id, doctorId, date: visitDate,
      start: isAnna ? toMin("10:30") : toMin("15:00") + (visitSeq % 2) * 30,
      kind: "primary", status: "done",
      complaints: profile.complaints.join(". ") || "Жалоб нет",
      anamnesis: profile.anamnesis || "Без особенностей",
      objective: OBJECTIVE(r),
      diagnoses: profile.diagnoses.map(icd),
      recommendations: RECOMMENDATIONS[programId] ?? RECOMMENDATIONS.base,
      appointmentId: isAnna ? "a-anna-h1" : undefined,
    };
    visitSeq++;
    visits.push(visit);
    documents.push({
      id: `doc-${visit.id}`, patientId: p.id, kind: "protocol", title: "Протокол первичного приёма", date: visit.date,
      doctorId, visitId: visit.id, body: protocolBody(visit), ...docStatus(visit.date),
    });

    // Анализы — у части гостей
    if (r.chance(0.45) || isAnna) {
      const chol = isAnna ? 5.9 : +(r.int(42, 66) / 10).toFixed(1);
      const glu = +(r.int(44, 64) / 10).toFixed(1);
      labs.push({
        id: `lab-${p.id}`, patientId: p.id, date: addDays(visitDate, 1), title: "Общий и биохимический анализ крови",
        items: [
          { name: "Гемоглобин", value: String(p.sex === "f" ? r.int(118, 142) : r.int(132, 160)), unit: "г/л", ref: p.sex === "f" ? "120–140" : "130–160" },
          { name: "Лейкоциты", value: (r.int(42, 88) / 10).toFixed(1), unit: "×10⁹/л", ref: "4,0–9,0" },
          { name: "СОЭ", value: String(r.int(4, 18)), unit: "мм/ч", ref: "2–15" },
          { name: "Глюкоза", value: glu.toFixed(1), unit: "ммоль/л", ref: "3,9–6,1", flag: glu > 6.1 ? ("high" as const) : undefined },
          { name: "Холестерин общий", value: chol.toFixed(1), unit: "ммоль/л", ref: "до 5,2", flag: chol > 5.2 ? ("high" as const) : undefined },
        ].map((x) => ({ ...x, value: x.value.replace(".", ",") })),
      });
    }

    // Курс процедур — только у проживающих гостей с лечебной программой
    if (!stay || programId === "rest") continue;
    const nights = nightsBetween(stay.from, stay.to);
    const typical = program(programId).typicalProcedureIds;
    const picks = isAnna
      ? [["bath-pearl", 5, "daily"], ["magnet", 5, "daily"], ["massage-collar", 3, "every_other_day"], ["oxy-cocktail", 6, "daily"], ["terrenkur", 6, "daily"]] as const
      : r.shuffle(typical).slice(0, r.int(3, 8)).map((id) => {
          const freq: Frequency = r.weighted([["daily", 5], ["every_other_day", 3], ["twice_week", 1]]);
          const max = freq === "daily" ? nights - 1 : freq === "every_other_day" ? Math.ceil((nights - 1) / 2) : Math.ceil(nights / 4);
          return [id, Math.max(1, Math.min(10, max - r.int(0, 2))), freq] as const;
        });

    for (const [procedureId, total, frequency] of picks) {
      const id = `rx-${p.id}-${procedureId}`;
      const from = addDays(stay.from, 1);
      const rx: Prescription = { id, patientId: p.id, procedureId, doctorId, total, frequency, from, createdAt: visitDate, status: "active" };
      const plan = planCourse(
        { procedures: PROCEDURES, rooms: MED_ROOMS, sessions, guestBusy: busyOf(p.id), stay, today: from },
        { patientId: p.id, procedureId, total, frequency, from },
      );
      if (!plan.sessions.length) continue;
      rx.total = plan.sessions.length;
      prescriptions.push(rx);
      plan.sessions.forEach((s, k) => {
        const past = s.date < TODAY || (s.date === TODAY && s.end <= DEMO_NOW);
        sessions.push({
          ...s, id: `${id}-${k + 1}`, prescriptionId: id,
          status: past ? (r.chance(0.05) ? "missed" : "done") : "planned",
          markedBy: past ? r.pick(["st-kravchenko", "st-efimova"]) : undefined,
        });
      });
    }

    // Выписка — у гостей, которые выезжают сегодня
    if (stay.to === TODAY) {
      const rxs = prescriptions.filter((x) => x.patientId === p.id);
      documents.push({
        id: `doc-${p.id}-discharge`, patientId: p.id, kind: "discharge", title: "Выписной эпикриз", date: TODAY, doctorId,
        status: r.chance(0.5) ? "signed" : "draft",
        body: [
          { heading: "Период лечения", text: `${fmtDay(stay.from)} — ${fmtDay(stay.to)}, программа «${program(programId).title}»` },
          { heading: "Диагноз", text: visit.diagnoses.map((d) => `${d.code} — ${d.title}`).join("; ") },
          { heading: "Проведённое лечение", text: rxs.map((x) => `${PROCEDURES.find((pr) => pr.id === x.procedureId)!.title} — ${x.total}`).join("; ") },
          { heading: "Результат", text: "Состояние улучшилось, жалобы уменьшились." },
          { heading: "Рекомендации", text: "Продолжить лечебную гимнастику дома. Повторный курс через 6–12 месяцев." },
        ],
      });
    }
  }

  // Повторный приём Мельниковой сегодня в 10:00 уже проведён — протокол ждёт подписи врача
  const mel = visits.find((v) => v.patientId === "p-melnikova")!;
  const repeat: Visit = {
    ...mel, id: "v-p-melnikova-2", doctorId: "orlova", appointmentId: "a-o3", date: TODAY, start: toMin("10:00"), kind: "repeat",
    complaints: "Отёки к вечеру уменьшились, тяжести после еды нет", anamnesis: "Неделя программы DETOX, процедуры переносит хорошо.",
    recommendations: "Продолжить курс. Контроль веса через 3 дня.",
  };
  visits.push(repeat);
  documents.push({
    id: "doc-v-p-melnikova-2", patientId: "p-melnikova", kind: "protocol", title: "Протокол повторного приёма", date: TODAY,
    doctorId: "orlova", visitId: repeat.id, body: protocolBody(repeat), status: "draft",
  });

  /* --- 5. Питание: заказы на сегодня и на завтра (ресторан «А-ля карт», корпус 4) --- */
  const mealOrders: MealOrder[] = [];
  const tomorrow = addDays(TODAY, 1);
  for (const p of patients) {
    const stay = stays.find((s) => s.id === p.stayId);
    if (!stay) continue;
    const room = gelRooms.find((x) => x.id === stay.hotelRoomId);
    // Заказ на завтра делают гости ресторана «А-ля карт» (корпус 4) и пятизвёздочного санатория
    if (!room || !(room.building === "Корпус 4" || room.sanatoriumId === "gelendzhik5")) continue;
    for (const date of [TODAY, tomorrow]) {
      if (!(stay.from <= date && date < stay.to)) continue;
      if (date === tomorrow && (p.id === "p-anna" || r.chance(0.35))) continue; // не все заказали на завтра
      const table = p.dietTableId ?? "t15";
      const dishIds = (["breakfast", "lunch", "lunch", "dinner"] as const).map((meal, k) => {
        const options = DISHES.filter((d) => d.meal === meal && d.tableIds.includes(table));
        return options[(k + r.int(0, options.length - 1)) % options.length].id;
      });
      mealOrders.push({ id: `meal-${p.id}-${date}`, patientId: p.id, date, dishIds: [...new Set(dishIds)] });
    }
  }

  /* --- 6. Журнал действий за сегодня --- */
  const audit: AuditEntry[] = [];
  const log = (time: string, staffId: string, kind: AuditEntry["kind"], action: string, patientId?: string) =>
    audit.push({ id: `au-${audit.length + 1}`, at: `${TODAY}T${time}:00`, staffId, kind, action, patientId });
  log("07:58", "st-gordeeva", "login", "Вход в систему (два шага)");
  log("08:02", "st-efimova", "login", "Вход в систему (два шага)");
  log("08:05", "st-kravchenko", "login", "Вход в систему (два шага)");
  log("08:41", "st-orlova", "login", "Вход в систему (два шага)");
  log("08:44", "st-orlova", "view", "Открыла карту гостя", "p-kovaleva");
  log("08:47", "st-orlova", "view", "Открыла карту гостя", "p-tarasov");
  log("09:12", "st-efimova", "edit", "Отметила процедуру выполненной: ванна жемчужная", "p-anna");
  log("09:20", "st-volkova", "login", "Вход в систему (два шага)");
  log("09:26", "st-volkova", "sign", "Подписала протокол приёма", "p-solovyova");
  log("09:31", "st-volkova", "send", "Отправила документ в ЕГИСЗ", "p-solovyova");
  log("09:40", "st-timofeeva", "export", "Сформировала сводку для кухни на завтра");
  log("09:55", "st-belousova", "denied", "Попытка открыть карту гостя — нет доступа к медицинским данным");
  log("10:02", "st-kravchenko", "edit", "Отметила процедуру: гость не пришёл", "p-lebedev");
  log("10:15", "st-gordeeva", "edit", "Заселила гостя", patients.find((p) => awaiting.has(p.id) && p.id.startsWith("p-0"))?.id);
  log("10:21", "st-orlova", "view", "Открыла анализы гостя", "p-anna");
  log("10:33", "st-kotov", "login", "Вход в систему (два шага)");
  audit.reverse();

  return { patients, hotelRooms: rooms, stays, prescriptions, sessions, visits, documents, labs, mealOrders, audit };
}

/** Короткое описание сгенерированной базы — для проверки и раздела «Для разработчиков» */
export function datasetSummary() {
  const d = dataset();
  const gel = d.stays.filter((s) => s.sanatoriumId === "gelendzhik");
  const gelRooms = d.hotelRooms.filter((x) => x.sanatoriumId === "gelendzhik");
  const occ = (date: ISODate) => gel.filter((s) => s.from <= date && date < s.to).length / gelRooms.length;
  const days = Array.from({ length: 30 }, (_, i) => addDays(TODAY, i));
  return {
    patients: d.patients.length,
    byType: Object.fromEntries(["guest", "future_guest", "outpatient"].map((t) => [t, d.patients.filter((p) => p.type === t).length])),
    gelendzhikRooms: gelRooms.length,
    occupancy30: Math.round((days.reduce((s, x) => s + occ(x), 0) / days.length) * 100),
    occupancyToday: Math.round(occ(TODAY) * 100),
    stays: d.stays.length,
    prescriptions: d.prescriptions.length,
    sessions: d.sessions.length,
    sessionsToday: d.sessions.filter((s) => s.date === TODAY).length,
    documents: d.documents.length,
    labs: d.labs.length,
    mealOrders: d.mealOrders.length,
    dietTables: DIET_TABLES.length,
    sample: d.sessions.filter((s) => s.patientId === "p-anna" && s.date === TODAY).map((s) => `${fmtTime(s.start)} ${s.procedureId}`),
  };
}
