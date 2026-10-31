/**
 * Роли персонала и разделы МИС.
 *
 * Роль определяет меню, стартовый экран и доступ к разделам (принцип минимального доступа:
 * сотрудник видит только то, что нужно для работы). В рабочей версии роли и права
 * хранятся на сервере и настраиваются администратором системы.
 */
import type { RoleId } from "@/lib/types";

export type { RoleId };

export type SectionId =
  | "today" | "patients" | "procedures" | "rooms" | "egisz"
  | "stays" | "bookings" | "meals" | "records" | "analytics" | "sources" | "admin" | "help";

export interface Section {
  id: SectionId;
  title: string;
  href: string;
  /** Раздел содержит медицинские данные гостей */
  medical?: boolean;
}

export const SECTIONS: Record<SectionId, Section> = {
  today: { id: "today", title: "Мой день", href: "/mis/today", medical: true },
  patients: { id: "patients", title: "Гости и пациенты", href: "/mis/patients", medical: true },
  procedures: { id: "procedures", title: "Процедурный кабинет", href: "/mis/procedures", medical: true },
  rooms: { id: "rooms", title: "Загрузка кабинетов", href: "/mis/rooms-schedule" },
  egisz: { id: "egisz", title: "ЕГИСЗ и документы", href: "/mis/egisz", medical: true },
  stays: { id: "stays", title: "Шахматка номеров", href: "/mis/stays" },
  bookings: { id: "bookings", title: "Брони и путёвки", href: "/mis/bookings" },
  meals: { id: "meals", title: "Питание", href: "/mis/meals" },
  records: { id: "records", title: "Онлайн-запись", href: "/mis/booking" },
  analytics: { id: "analytics", title: "Сводная панель", href: "/mis/analytics" },
  sources: { id: "sources", title: "Источники гостей", href: "/mis/sources" },
  admin: { id: "admin", title: "Администрирование", href: "/mis/admin" },
  help: { id: "help", title: "Справка", href: "/mis/help" },
};

export interface Role {
  id: RoleId;
  title: string;
  /** Одна строка «что вы здесь делаете» для экрана входа */
  line: string;
  /** Иконка lucide (название компонента) */
  icon: "stethoscope" | "syringe" | "concierge" | "calendar" | "utensils" | "chart" | "megaphone" | "shield";
  start: SectionId;
  menu: SectionId[];
}

export const ROLES: Role[] = [
  {
    id: "doctor", title: "Врач", icon: "stethoscope",
    line: "Пациенты на сегодня, приём, назначения и документы",
    start: "today", menu: ["today", "patients", "rooms", "egisz", "records", "help"],
  },
  {
    id: "nurse", title: "Медсестра процедурного кабинета", icon: "syringe",
    line: "Очередь процедур и отметка «выполнено» одним нажатием",
    start: "procedures", menu: ["procedures", "rooms", "patients", "help"],
  },
  {
    id: "reception", title: "Ресепшн и размещение", icon: "concierge",
    line: "Заезды и выезды, шахматка номеров, заселение",
    start: "stays", menu: ["stays", "bookings", "patients", "records", "help"],
  },
  {
    id: "booking", title: "Отдел бронирования", icon: "calendar",
    line: "Брони и путёвки, создание новой брони",
    start: "bookings", menu: ["bookings", "stays", "help"],
  },
  {
    id: "restaurant", title: "Ресторан и диетсестра", icon: "utensils",
    line: "Диетстолы гостей и заказы блюд на завтра",
    start: "meals", menu: ["meals", "help"],
  },
  {
    id: "manager", title: "Руководитель", icon: "chart",
    line: "Загрузка, выручка и записи по всей сети",
    start: "analytics", menu: ["analytics", "sources", "stays", "records", "egisz", "help"],
  },
  {
    id: "marketer", title: "Маркетолог", icon: "megaphone",
    line: "Откуда приходят гости — без доступа к медицинским данным",
    start: "sources", menu: ["sources", "help"],
  },
  {
    id: "sysadmin", title: "Администратор системы", icon: "shield",
    line: "Пользователи и роли, журнал действий, серверы и интеграции",
    start: "admin", menu: ["admin", "help"],
  },
];

export const roleById = (id: RoleId) => ROLES.find((r) => r.id === id)!;

/** Может ли роль открыть раздел. Справка доступна всем. */
export const canOpen = (role: RoleId, section: SectionId) => section === "help" || roleById(role).menu.includes(section);
