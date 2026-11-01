/**
 * Конфигурация арендатора (сети санаториев).
 *
 * Весь брендинг МИС — название, логотип, цвета, список объектов — берётся отсюда.
 * Чтобы развернуть систему для другой сети, достаточно добавить ещё один конфиг:
 * интерфейс и логика не меняются.
 *
 * Данные объектов Ревиталь — с официального сайта revital.ru (адреса, категории номеров,
 * цены «от» за ночь, ключевые факты). Количество номеров по категориям и загрузка — демо.
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
  /** Цена номера за ночь «от», ₽ — по открытым данным сайта (демо) */
  priceRub: number;
  note?: string;
}

export interface Restaurant {
  id: string;
  title: string;
  seats: number;
  note: string;
  /** Гости заказывают блюда на следующий день (иначе кухня готовит по числу гостей на диетстолах) */
  preorder?: boolean;
}

export interface Sanatorium {
  id: SanatoriumId;
  /** Санаторий с проживанием или СПА-клуб (только процедуры, без номеров) */
  kind: "sanatorium" | "spa";
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
  /** Медицинский центр, которым пользуются гости (у двух санаториев Геленджика он общий) */
  medCenter?: SanatoriumId;
  /** Страница объекта на сайте сети */
  site: string;
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
    kind: "sanatorium",
    title: "Ревиталь Парк Геленджик 4★",
    short: "Геленджик 4★",
    city: "Геленджик",
    address: "г. Геленджик, ул. Маячная, 3",
    stars: 4,
    facts: ["Центр Геленджика, выход на набережную и к морю", "Корпуса №2 и №4", "Многопрофильный медицинский центр", "Круглогодичный бассейн и собственный пляж"],
    buildings: ["Корпус 2", "Корпус 4"],
    roomTypes: [
      { id: "std-2", title: "Стандарт", building: "Корпус 2", areaM2: 31, count: 48, priceRub: 19900, note: "Шведский стол" },
      { id: "std-4", title: "Стандарт", building: "Корпус 4", areaM2: 28, count: 36, priceRub: 19900, note: "Питание «А-ля карт»" },
      { id: "family", title: "Стандарт семейный двухкомнатный", building: "Корпус 4", areaM2: 46, count: 10, priceRub: 22000 },
      { id: "junior", title: "Джуниор сюит", building: "Корпус 4", areaM2: 30, count: 12, priceRub: 20800, note: "С террасой" },
      { id: "lux", title: "Люкс", building: "Корпус 2", areaM2: 60, count: 6, priceRub: 27900 },
      { id: "lux-extra", title: "Люкс экстра", building: "Корпус 2", areaM2: 71, count: 2, priceRub: 33000, note: "Терраса 48 м²" },
    ],
    restaurants: [
      { id: "alacarte", title: "А-ля карт", seats: 129, note: "Диетическое питание по заказу на следующий день", preorder: true },
      { id: "buffet", title: "Шведский стол", seats: 89, note: "Завтрак, обед и ужин в формате буфета" },
    ],
    meals: MEALS,
    checkIn: "14:00",
    checkOut: "12:00",
    medCenter: "gelendzhik",
    site: "revital.ru/gelendzhik/hotels/4-zvezdi/",
  },
  {
    id: "gelendzhik5",
    kind: "sanatorium",
    title: "Ревиталь Парк Геленджик 5★",
    short: "Геленджик 5★",
    city: "Геленджик",
    address: "г. Геленджик, ул. Маячная, 1",
    stars: 5,
    facts: ["Премиум-класс на первой береговой линии", "СПА-комплекс с крытым бассейном с морской водой", "Собственный пляж, закрытая территория", "Лечение — в медицинском центре на Маячной"],
    buildings: ["Главный корпус"],
    roomTypes: [
      { id: "junior5", title: "Джуниор сюит", areaM2: 43, count: 12, priceRub: 25800 },
      { id: "lux5", title: "Люкс двухкомнатный", areaM2: 77, count: 8, priceRub: 29900 },
      { id: "president", title: "Президентский люкс", areaM2: 170, count: 1, priceRub: 36300 },
    ],
    restaurants: [{ id: "restaurant5", title: "Ресторан 5★", seats: 60, note: "Меню по диетстолу, заказ на следующий день", preorder: true }],
    meals: MEALS,
    checkIn: "14:00",
    checkOut: "12:00",
    medCenter: "gelendzhik",
    site: "revital.ru/gelendzhik/hotels/5-zvezd/",
  },
  {
    id: "sochi",
    kind: "sanatorium",
    title: "Ревиталь Парк Сочи",
    short: "Сочи",
    city: "Сочи",
    address: "г. Сочи, Хостинский район, Курортный проспект, 102А",
    stars: 4,
    facts: ["Работает с 2004 года", "65 номеров в 8 коттеджах", "5 км до мацестинских источников", "Бассейн «Инфинити» с подогревом"],
    buildings: ["Коттеджи"],
    roomTypes: [
      { id: "std", title: "Стандарт", areaM2: 24, count: 14, priceRub: 10100 },
      { id: "junior", title: "Джуниор сюит", areaM2: 32, count: 44, priceRub: 10100 },
      { id: "junior-family", title: "Джуниор сюит семейный", areaM2: 49, count: 7, priceRub: 13500 },
    ],
    restaurants: [{ id: "veranda", title: "Кафе «Веранда»", seats: 120, note: "Полный пансион, диетическое меню по назначению врача" }],
    meals: MEALS,
    checkIn: "14:00",
    checkOut: "12:00",
    medCenter: "sochi",
    site: "revital.ru/sochi/",
  },
  {
    id: "balashikha",
    kind: "sanatorium",
    title: "Клиника-санаторий Ревиталь Парк Балашиха",
    short: "Балашиха",
    city: "Балашиха",
    address: "Московская область, Балашиха, Леоновское шоссе, 2",
    stars: 4,
    facts: ["95 номеров и коттеджей", "60 кабинетов, более 170 методик", "Амбулаторное лечение без проживания", "35 минут от центра Москвы"],
    buildings: ["Главный корпус"],
    roomTypes: [
      { id: "std-1", title: "Стандарт одноместный", count: 20, priceRub: 13900 },
      { id: "std-2", title: "Стандарт двухместный", count: 40, priceRub: 16000 },
      { id: "studio", title: "Студия", count: 14, priceRub: 20600 },
      { id: "semi-lux", title: "Полулюкс", count: 11, priceRub: 24600 },
      { id: "lux-1", title: "Люкс однокомнатный", count: 6, priceRub: 29000 },
      { id: "lux-2", title: "Люкс двухкомнатный", count: 4, priceRub: 34000 },
    ],
    restaurants: [{ id: "main", title: "Ресторан", seats: 100, note: "Диетическое питание" }],
    meals: MEALS,
    checkIn: "14:00",
    checkOut: "12:00",
    medCenter: "balashikha",
    site: "revital.ru/balashiha/",
  },
  {
    id: "spa-moscow",
    kind: "spa",
    title: "СПА-клуб Ревиталь Москва",
    short: "СПА Москва",
    city: "Москва",
    address: "г. Москва, Коробейников переулок, 1",
    facts: ["СПА и косметология без проживания", "Запись на процедуры и абонементы"],
    buildings: [],
    roomTypes: [],
    restaurants: [],
    meals: MEALS,
    checkIn: "—",
    checkOut: "—",
    site: "revital.ru/spa-moscow/",
  },
  {
    id: "spa-odintsovo",
    kind: "spa",
    title: "СПА-клуб Ревиталь Одинцово",
    short: "СПА Одинцово",
    city: "Одинцово",
    address: "Московская область, Одинцово, ул. Маршала Неделина, 9",
    facts: ["СПА и косметология без проживания", "Запись на процедуры и абонементы"],
    buildings: [],
    roomTypes: [],
    restaurants: [],
    meals: MEALS,
    checkIn: "—",
    checkOut: "—",
    site: "revital.ru/spa-odintsovo/",
  },
];

/** Объекты с номерным фондом — для шахматки, броней и загрузки */
export const withRooms = (t: Tenant) => t.sanatoriums.filter((s) => s.kind === "sanatorium");

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
    title: ["Сосновый Кров Анапа", "Сосновый Кров Анапа Премиум", "Сосновый Кров Кисловодск", "Сосновый Кров Подмосковье", "Студия здоровья Казань", "Студия здоровья Самара"][i],
    short: ["Анапа", "Анапа Премиум", "Кисловодск", "Подмосковье", "Студия Казань", "Студия Самара"][i],
    city: ["Анапа", "Анапа", "Кисловодск", "Московская область", "Казань", "Самара"][i],
    address: "Адрес вымышленный",
  })),
  primary: "gelendzhik",
};

export const TENANTS: Tenant[] = [REVITAL, DEMO_TENANT];

export const tenantById = (id: string) => TENANTS.find((t) => t.id === id) ?? REVITAL;

/** CSS-переменные бренда для обёртки интерфейса */
export const brandStyle = (t: Tenant) =>
  Object.fromEntries(Object.entries(t.brand.colors).map(([k, v]) => [`--color-${k}`, v])) as CSSProperties;
