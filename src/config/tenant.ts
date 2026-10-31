/**
 * Конфигурация арендатора (сети санаториев).
 *
 * Весь брендинг МИС — название, логотип, цвета, список объектов — берётся отсюда.
 * Чтобы развернуть систему для другой сети, достаточно добавить ещё один конфиг:
 * интерфейс и логика не меняются.
 *
 * Данные объектов Ревиталь — из открытых источников; цены и загрузка в демо вымышлены.
 */
import type { CSSProperties } from "react";
import type { SanatoriumId } from "@/lib/types";

export type { SanatoriumId };

export interface RoomType {
  id: string;
  title: string;
  /** Корпус, если категория привязана к нему */
  building?: string;
  areaM2?: number;
  count: number;
  note?: string;
}

export interface Restaurant {
  id: string;
  title: string;
  seats: number;
  note: string;
}

export interface Sanatorium {
  id: SanatoriumId;
  title: string;
  /** Короткое имя для переключателя и графиков */
  short: string;
  city: string;
  address: string;
  stars?: number;
  facts: string[];
  buildings: string[];
  roomTypes: RoomType[];
  restaurants: Restaurant[];
  meals: { breakfast: string; lunch: string; dinner: string };
  checkIn: string;
  checkOut: string;
  /** Данные объекта ещё не заполнены — показываем заглушку */
  placeholder?: boolean;
}

export interface TenantBrand {
  /** Название сети в интерфейсе */
  name: string;
  /** Как пишется в логотипе */
  wordmark: string;
  tagline: string;
  /** Логотип: фирменные файлы Ревиталь или текстовый знак для других арендаторов */
  logo: "revital" | "wordmark";
  /** Переопределение цветовых токенов из globals.css */
  colors: Partial<Record<"forest" | "forest-deep" | "teal" | "teal-mid" | "gold" | "gold-soft" | "sage" | "sage-soft" | "cream" | "milk", string>>;
}

export interface Tenant {
  id: string;
  brand: TenantBrand;
  sanatoriums: Sanatorium[];
  /** Основной объект для демонстрации — его данные самые подробные */
  primary: SanatoriumId;
}

const MEALS = { breakfast: "08:00–10:00", lunch: "13:00–15:00", dinner: "18:00–20:00" };

const SANATORIUMS: Sanatorium[] = [
  {
    id: "gelendzhik",
    title: "Ревиталь Парк Геленджик",
    short: "Геленджик",
    city: "Геленджик",
    address: "г. Геленджик, ул. Маячная, 3",
    stars: 4,
    facts: ["Парк 9,5 га с реликтовыми соснами", "Корпуса №2 и №4", "Ванное отделение и физиотерапия"],
    buildings: ["Корпус 2", "Корпус 4"],
    roomTypes: [
      { id: "std-2", title: "Стандарт", building: "Корпус 2", areaM2: 31, count: 48, note: "Шведский стол" },
      { id: "std-4", title: "Стандарт", building: "Корпус 4", areaM2: 28, count: 36, note: "Питание «А-ля карт»" },
      { id: "family", title: "Стандарт семейный двухкомнатный", building: "Корпус 4", areaM2: 46, count: 10 },
      { id: "junior", title: "Джуниор сюит", building: "Корпус 4", areaM2: 30, count: 12, note: "С террасой" },
      { id: "lux", title: "Люкс", building: "Корпус 2", areaM2: 60, count: 6 },
      { id: "lux-extra", title: "Люкс экстра", building: "Корпус 2", areaM2: 71.4, count: 2, note: "Терраса 48 м²" },
    ],
    restaurants: [
      { id: "alacarte", title: "А-ля карт", seats: 129, note: "Диетическое питание по заказу на следующий день" },
      { id: "buffet", title: "Шведский стол", seats: 89, note: "Завтрак, обед и ужин в формате буфета" },
    ],
    meals: MEALS,
    checkIn: "14:00",
    checkOut: "12:00",
  },
  {
    id: "sochi",
    title: "Ревиталь Парк Сочи",
    short: "Сочи",
    city: "Сочи",
    address: "г. Сочи, Хостинский район, Курортный проспект, 102А",
    stars: 4,
    facts: ["65 номеров", "Морской климат Хосты"],
    buildings: ["Главный корпус"],
    roomTypes: [
      { id: "std", title: "Стандарт", count: 14 },
      { id: "junior", title: "Джуниор сюит", count: 44 },
      { id: "junior-family", title: "Джуниор сюит семейный", count: 7 },
    ],
    restaurants: [{ id: "main", title: "Ресторан", seats: 120, note: "Диетическое меню по назначению врача" }],
    meals: MEALS,
    checkIn: "14:00",
    checkOut: "12:00",
  },
  {
    id: "balashikha",
    title: "Ревиталь Парк Балашиха",
    short: "Балашиха",
    city: "Балашиха",
    address: "Московская область, Балашиха, мкр. Кучино, Леоновское шоссе, 2",
    facts: ["Территория 8 га", "До 95 гостей", "СПА-комплекс с 07:00 до 23:00"],
    buildings: ["Главный корпус"],
    roomTypes: [
      { id: "std-1", title: "Стандарт одноместный", count: 12 },
      { id: "std-2", title: "Стандарт двухместный", count: 22 },
      { id: "studio", title: "Студия", count: 6 },
      { id: "semi-lux", title: "Полулюкс", count: 5 },
      { id: "lux-1", title: "Люкс однокомнатный", count: 3 },
      { id: "lux-2", title: "Люкс двухкомнатный", count: 2 },
    ],
    restaurants: [{ id: "main", title: "Ресторан", seats: 100, note: "Диетическое меню по назначению врача" }],
    meals: MEALS,
    checkIn: "14:00",
    checkOut: "12:00",
  },
  {
    // ЗАПОЛНИТЬ: название, адрес и номерной фонд четвёртого объекта сети уточняются
    id: "fourth",
    title: "Четвёртый объект сети",
    short: "Объект №4",
    city: "Уточняется",
    address: "Адрес уточняется",
    facts: ["Данные объекта будут добавлены после согласования"],
    buildings: ["Корпус 1"],
    roomTypes: [{ id: "std", title: "Стандарт", count: 40 }],
    restaurants: [{ id: "main", title: "Ресторан", seats: 80, note: "Уточняется" }],
    meals: MEALS,
    checkIn: "14:00",
    checkOut: "12:00",
    placeholder: true,
  },
];

export const REVITAL: Tenant = {
  id: "revital",
  brand: {
    name: "Ревиталь",
    wordmark: "РЕВИТАЛЬ",
    tagline: "Медицинская информационная система",
    logo: "revital",
    colors: {},
  },
  sanatoriums: SANATORIUMS,
  primary: "gelendzhik",
};

/**
 * Вымышленная сеть для показа «как это выглядит для другого санатория».
 * Название и цвета придуманы, совпадения с реальными брендами случайны.
 */
export const DEMO_TENANT: Tenant = {
  id: "demo",
  brand: {
    name: "Сосновый Кров",
    wordmark: "СОСНОВЫЙ КРОВ",
    tagline: "Медицинская информационная система",
    logo: "wordmark",
    colors: {
      forest: "#3b4a6b",
      "forest-deep": "#252f47",
      teal: "#5a6f9a",
      "teal-mid": "#6f84ad",
      gold: "#c98a5b",
      "gold-soft": "#f3dcc8",
      sage: "#cdd5e4",
      "sage-soft": "#e4e9f2",
    },
  },
  sanatoriums: SANATORIUMS.map((s, i) => ({
    ...s,
    title: ["Сосновый Кров Анапа", "Сосновый Кров Кисловодск", "Сосновый Кров Подмосковье", "Сосновый Кров Алтай"][i],
    short: ["Анапа", "Кисловодск", "Подмосковье", "Алтай"][i],
    city: ["Анапа", "Кисловодск", "Московская область", "Алтай"][i],
    address: "Адрес вымышленный",
    placeholder: false,
  })),
  primary: "gelendzhik",
};

export const TENANTS: Tenant[] = [REVITAL, DEMO_TENANT];

export const tenantById = (id: string) => TENANTS.find((t) => t.id === id) ?? REVITAL;

/** CSS-переменные бренда для обёртки интерфейса */
export const brandStyle = (t: Tenant) =>
  Object.fromEntries(Object.entries(t.brand.colors).map(([k, v]) => [`--color-${k}`, v])) as CSSProperties;
