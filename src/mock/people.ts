/**
 * MOCK-ДАННЫЕ: пациенты и маркетинговая статистика. Все данные вымышлены.
 */
import type { Attribution, Patient } from "@/lib/types";

export const PATIENTS: Patient[] = [
  {
    id: "p-anna",
    misId: "SAN-PAT-55120",
    firstName: "Анна",
    lastName: "Смирнова",
    phone: "+7 (900) 123-45-67",
    type: "guest",
    stay: { building: "Ревиталь Парк", roomNumber: "315", from: "2026-10-08", to: "2026-10-15" },
  },
];

export const CURRENT_PATIENT_ID = "p-anna";

export const DASHBOARD_STATS = {
  today: 48,
  bySource: [
    { label: "Через сайт", value: 21 },
    { label: "Instagram", value: 12 },
    { label: "Прямая ссылка", value: 8 },
    { label: "Другие источники", value: 7 },
  ],
  confirmed: 41,
  cancelled: 3,
  awaiting: 32,
  week: [31, 38, 35, 44, 40, 27, 48],
};

export const RECENT_ATTRIBUTED: { patient: string; doctorId: string; service: string; when: string; a: Attribution }[] = [
  {
    patient: "Григорьева В.", doctorId: "sokolova", service: "Консультация акушера-гинеколога", when: "12 окт, 10:00",
    a: { source: "Instagram", medium: "Видео врача", campaign: "Гинекология после 35", material: "Видео врача", utm_source: "instagram", utm_medium: "reels", utm_campaign: "gyn_after_35", landing_page: "/booking?direction=gynecology", referrer: "instagram.com" },
  },
  {
    patient: "Смирнова А.", doctorId: "orlova", service: "Аппаратная косметологическая процедура", when: "12 окт, 11:00",
    a: { source: "Сайт", medium: "Страница косметологии", campaign: "Осенний уход", utm_source: "site", utm_medium: "button", utm_campaign: "autumn_care", landing_page: "/cosmetology", referrer: "revitalpark.ru" },
  },
  {
    patient: "Тарасов Д.", doctorId: "orlova", service: "Первичная консультация терапевта", when: "12 окт, 09:30",
    a: { source: "QR-код", medium: "Номер гостя", campaign: "QR в номерах", material: "Карточка на столе", utm_source: "qr", utm_medium: "room_card", utm_campaign: "rooms_qr", landing_page: "/booking?guest=1", referrer: "—" },
  },
  {
    patient: "Попов А.", doctorId: "morozov", service: "Консультация невролога", when: "12 окт, 14:00",
    a: { source: "Яндекс Директ", medium: "Поиск", campaign: "Боль в спине Краснодарский край", utm_source: "yandex", utm_medium: "cpc", utm_campaign: "neuro_back_pain", landing_page: "/neurology", referrer: "yandex.ru" },
  },
  {
    patient: "Миронова А.", doctorId: "lebedeva", service: "Консультация психолога", when: "12 окт, 12:00",
    a: { source: "Telegram", medium: "Пост в канале", campaign: "Неделя без стресса", utm_source: "telegram", utm_medium: "channel_post", utm_campaign: "no_stress_week", landing_page: "/booking?direction=psychology", referrer: "t.me" },
  },
  {
    patient: "Орехова К.", doctorId: "sokolova", service: "УЗИ органов малого таза", when: "12 окт, 11:00",
    a: { source: "Instagram", medium: "Истории в Instagram", campaign: "Гинекология после 35", material: "Истории с опросом", utm_source: "instagram", utm_medium: "stories", utm_campaign: "gyn_after_35", landing_page: "/booking?direction=gynecology", referrer: "instagram.com" },
  },
  {
    patient: "Захаров П.", doctorId: "volkova", service: "Аппаратная физиотерапия", when: "12 окт, 13:00",
    a: { source: "MAX", medium: "Сообщение", campaign: "Напоминание о курсе", utm_source: "max", utm_medium: "message", utm_campaign: "course_reminder", landing_page: "/cabinet", referrer: "max.ru" },
  },
  {
    patient: "Кузнецова О.", doctorId: "belova", service: "Программа восстановительной медицины", when: "12 окт, 15:00",
    a: { source: "СМС", medium: "Рассылка", campaign: "Возврат гостей весны", utm_source: "sms", utm_medium: "broadcast", utm_campaign: "spring_return", landing_page: "/booking", referrer: "—" },
  },
  {
    patient: "Яковлева Т.", doctorId: "orlova", service: "Косметологическая консультация", when: "12 окт, 13:30",
    a: { source: "Прямая ссылка", medium: "—", campaign: "—", utm_source: "—", utm_medium: "—", utm_campaign: "—", landing_page: "/booking", referrer: "—" },
  },
];
