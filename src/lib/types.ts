/**
 * Доменная модель Онлайн-запись Ревиталь.
 *
 * Эти типы — контракт между интерфейсом и слоем сервисов (src/services).
 * Сейчас сервисы отдают mock-данные; при подключении МИС «Санаториум»
 * integration service будет приводить ответы API к этим же типам,
 * поэтому UI переписывать не придётся.
 */

export type ISODate = string; // "2026-10-12"
export type Minutes = number; // минуты от полуночи: 11:00 → 660

export type DoctorStatus = "on_shift" | "off_shift" | "vacation" | "sick";

export interface Doctor {
  id: string;
  /** ID врача в МИС «Санаториум» — связь для синхронизации */
  misId: string;
  lastName: string;
  firstName: string;
  patronymic: string;
  specialties: string[];
  directionIds: string[];
  /** Основной кабинет (может отсутствовать — врач работает в общих кабинетах) */
  mainRoomId: string | null;
  /** Все кабинеты, где врач может вести приём, в порядке приоритета */
  roomIds: string[];
  serviceIds: string[];
  experienceYears: number;
  about: string;
  /** Рабочие дни недели: 1 — пн … 7 — вс */
  workDays: number[];
  shiftStart: Minutes;
  shiftEnd: Minutes;
  /** Периоды отсутствия */
  absences: { from: ISODate; to: ISODate; status: Extract<DoctorStatus, "vacation" | "sick"> }[];
  /** Оттенок фото-заглушки */
  tone: "sage" | "sand" | "teal" | "gold" | "linen" | "mist";
}

/**
 * Режим доступа к кабинету:
 *  - personal — закреплён за одним врачом, другим не назначается никогда;
 *  - group    — доступен только перечисленным специалистам;
 *  - shared   — общий, доступен любому врачу, которому разрешена услуга.
 */
export type RoomAccess = "personal" | "group" | "shared";

export type RoomKind = "consultation" | "procedure" | "diagnostic" | "cosmetology" | "psychology";

export interface Room {
  id: string;
  misId: string;
  number: string;
  floor: number;
  title: string;
  kind: RoomKind;
  access: RoomAccess;
  ownerDoctorId?: string;
  allowedDoctorIds?: string[];
  equipment: string[];
}

export interface Direction {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Service {
  id: string;
  misId: string;
  title: string;
  directionId: string;
  durationMin: number;
  /** Кабинеты, оборудованные для услуги */
  roomIds: string[];
  doctorIds: string[];
  priceRub: number;
  description: string;
  /** Можно записаться самостоятельно без назначения врача */
  selfBooking: boolean;
}

export type AppointmentStatus = "confirmed" | "pending" | "cancelled" | "completed";

export interface Attribution {
  source: string;
  medium: string;
  campaign: string;
  material?: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  landing_page: string;
  referrer: string;
}

export interface Appointment {
  id: string;
  /** ID записи в МИС — приходит после создания записи через API */
  misId?: string;
  patientId: string | null;
  patientName: string;
  doctorId: string;
  serviceId: string | null;
  /** null — внутренняя занятость врача без кабинета (обход, совещание) */
  roomId: string | null;
  date: ISODate;
  start: Minutes;
  end: Minutes;
  status: AppointmentStatus;
  kind: "visit" | "block";
  note?: string;
  attribution?: Attribution;
  createdVia: "online" | "mis" | "phone";
  createdAt: string;
}

export type PatientType = "guest" | "future_guest" | "outpatient";

export interface Patient {
  id: string;
  misId: string;
  firstName: string;
  lastName: string;
  phone: string;
  type: PatientType;
  stay?: { building: string; roomNumber: string; from: ISODate; to: ISODate };
  /* ---- поля медицинской карты МИС (онлайн-записи они не нужны) ---- */
  patronymic?: string;
  birthDate?: ISODate;
  sex?: "f" | "m";
  city?: string;
  sanatoriumId?: SanatoriumId;
  /** Текущее или ближайшее проживание */
  stayId?: string;
  programId?: string;
  dietTableId?: string;
  allergies?: string[];
  chronic?: string[];
  /** Вымышленный документ, в интерфейсе всегда маскируется */
  passport?: string;
  /** СНИЛС — обязателен для регистрации документов в РЭМД */
  snils?: string;
}

export interface SmsMessage {
  id: string;
  appointmentId: string;
  kind: "created" | "day_before" | "two_hours" | "changed" | "cancelled";
  text: string;
  sendAt: string; // человекочитаемо: «сразу», «11 окт, 11:00»
  status: "sent" | "scheduled" | "skipped";
}

/** Шаг проверки слота — для наглядного объяснения в презентации */
export interface RoomCheck {
  roomId: string;
  state: "free" | "busy" | "not_allowed" | "not_equipped";
  busyBy?: Appointment;
  reason: string;
}

export interface SlotCheck {
  doctorId: string;
  serviceId: string;
  date: ISODate;
  start: Minutes;
  end: Minutes;
  shift: { ok: boolean; reason: string };
  doctor: { ok: boolean; reason: string; busyBy?: Appointment };
  rooms: RoomCheck[];
  assignedRoomId: string | null;
  available: boolean;
  summary: string;
}

export interface Slot {
  date: ISODate;
  start: Minutes;
  end: Minutes;
  doctorId: string;
  /** Кабинет назначается системой и НЕ показывается пациенту до подтверждения */
  roomId: string;
}

/* ================================================================
 * МИС: сеть санаториев, персонал, роли.
 * ================================================================ */

export type SanatoriumId = "gelendzhik" | "gelendzhik5" | "sochi" | "balashikha" | "spa-moscow" | "spa-odintsovo";

export type RoleId = "chief" | "doctor" | "nurse" | "reception" | "booking" | "restaurant" | "manager" | "marketer" | "sysadmin";

export interface Staff {
  id: string;
  sanatoriumId: SanatoriumId;
  role: RoleId;
  lastName: string;
  firstName: string;
  patronymic: string;
  position: string;
  /** Связь с карточкой врача онлайн-записи (для врачей) */
  doctorId?: string;
  /** Процедурный кабинет медсестры */
  roomId?: string;
  email: string;
  lastSeen: string;
  twoFactor: boolean;
  active: boolean;
}

/* ---------- Номерной фонд и проживание ---------- */

export interface HotelRoom {
  id: string;
  sanatoriumId: SanatoriumId;
  number: string;
  building: string;
  floor: number;
  /** Категория номера из конфига санатория */
  typeId: string;
  /** Номер выведен из продажи */
  repair?: boolean;
}

export type StayStatus = "booked" | "checked_in" | "checked_out" | "cancelled";
export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface Stay {
  id: string;
  sanatoriumId: SanatoriumId;
  /** Гость с медицинской картой; null — бронь без лечения или карта ещё не заведена */
  patientId: string | null;
  guestName: string;
  hotelRoomId: string;
  from: ISODate;
  to: ISODate;
  guests: number;
  programId: string;
  status: StayStatus;
  payment: PaymentStatus;
  amountRub: number;
  paidRub: number;
  source: string;
  createdAt: ISODate;
}

/** Состояние номера в шахматке на конкретный день */
export type RoomDayState = "free" | "booked" | "living" | "cleaning" | "repair";

/* ---------- Медицина: процедуры, кабинеты, назначения ---------- */

export type ProcedureCategory =
  | "bath" | "shower" | "physio" | "massage" | "ayurveda" | "mud" | "climate" | "inhalation"
  | "injection" | "fitness" | "diagnostics" | "cosmetology" | "other";

export interface Procedure {
  id: string;
  title: string;
  category: ProcedureCategory;
  durationMin: number;
  priceRub: number;
  /** Кабинеты, где есть оборудование для процедуры */
  roomIds: string[];
  /** Оборудование, без которого процедуру не провести */
  equipment?: string;
  /** Противопоказания, о которых предупреждает система */
  caution?: string;
}

export type MedRoomKind = "bath" | "physio" | "massage" | "procedure" | "diagnostic" | "fitness" | "climate" | "cosmetology";

export interface MedRoom {
  id: string;
  sanatoriumId: SanatoriumId;
  number: string;
  title: string;
  kind: MedRoomKind;
  equipment: string[];
  /** Сколько гостей одновременно (ванн, кушеток, мест) */
  capacity: number;
  open: Minutes;
  close: Minutes;
  /** Ответственная медсестра */
  nurseId?: string;
}

export interface Program {
  id: string;
  title: string;
  short: string;
  description: string;
  minNights: number;
  /** Лечение по программе: за одного гостя в ночь, ₽ (к цене номера) */
  pricePerNightRub: number;
  includes: string[];
  /** Процедуры, которые обычно назначает врач в рамках программы */
  typicalProcedureIds: string[];
}

export type Frequency = "daily" | "every_other_day" | "twice_week" | "once";

export interface Prescription {
  id: string;
  patientId: string;
  procedureId: string;
  doctorId: string;
  total: number;
  frequency: Frequency;
  from: ISODate;
  createdAt: ISODate;
  status: "active" | "cancelled";
  note?: string;
}

export type SessionStatus = "planned" | "done" | "missed" | "cancelled";

/** Один сеанс процедуры в расписании гостя */
export interface ProcedureSession {
  id: string;
  prescriptionId: string;
  patientId: string;
  procedureId: string;
  roomId: string;
  date: ISODate;
  start: Minutes;
  end: Minutes;
  status: SessionStatus;
  markedBy?: string;
}

/** Найденный конфликт при раскладке курса — понятным языком */
export interface PlanConflict {
  kind: "no_days" | "room_full" | "guest_busy" | "meal" | "stay_ends";
  text: string;
}

/* ---------- Приём врача и документы ---------- */

export interface Diagnosis {
  code: string;
  title: string;
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  date: ISODate;
  start: Minutes;
  kind: "primary" | "repeat" | "discharge";
  status: "in_progress" | "done";
  complaints: string;
  anamnesis: string;
  objective: string;
  diagnoses: Diagnosis[];
  recommendations: string;
}

export type DocKind = "protocol" | "discharge" | "referral" | "certificate";
export type DocStatus = "draft" | "signed" | "sent" | "registered" | "error";

export interface MedDocument {
  id: string;
  patientId: string;
  kind: DocKind;
  title: string;
  date: ISODate;
  doctorId: string;
  status: DocStatus;
  visitId?: string;
  /** Номер регистрации в РЭМД после успешной отправки */
  remdId?: string;
  errorText?: string;
  /** Текст документа для предпросмотра */
  body: { heading: string; text: string }[];
}

export interface LabResult {
  id: string;
  patientId: string;
  date: ISODate;
  title: string;
  items: { name: string; value: string; unit: string; ref: string; flag?: "high" | "low" }[];
}

/* ---------- Питание ---------- */

export interface DietTable {
  id: string;
  title: string;
  short: string;
  description: string;
}

export type MealKind = "breakfast" | "lunch" | "dinner";

export interface Dish {
  id: string;
  title: string;
  meal: MealKind;
  /** Каким диетстолам подходит блюдо */
  tableIds: string[];
  kcal: number;
}

export interface MealOrder {
  id: string;
  patientId: string;
  date: ISODate;
  dishIds: string[];
}

/* ---------- Безопасность ---------- */

export type AuditKind = "login" | "view" | "edit" | "sign" | "send" | "denied" | "export";

export interface AuditEntry {
  id: string;
  at: string;
  staffId: string;
  kind: AuditKind;
  action: string;
  patientId?: string;
}
