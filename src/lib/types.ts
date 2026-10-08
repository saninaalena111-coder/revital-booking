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
