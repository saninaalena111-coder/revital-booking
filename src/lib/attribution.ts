import type { Attribution } from "./types";

const SOURCE_LABEL: Record<string, string> = {
  instagram: "Instagram", site: "Сайт", yandex: "Яндекс Директ", qr: "QR-код",
  telegram: "Telegram", max: "MAX", sms: "СМС", vk: "ВКонтакте",
};
const MEDIUM_LABEL: Record<string, string> = {
  reels: "Видео врача", stories: "Истории в Instagram", cpc: "Поиск", room_card: "Карточка в номере",
  channel_post: "Пост в канале", message: "Сообщение", broadcast: "Рассылка", button: "Кнопка на сайте",
};
const CAMPAIGN_LABEL: Record<string, string> = {
  gyn_after_35: "Гинекология после 35", neuro_back_pain: "Боль в спине", rooms_qr: "QR в номерах",
  no_stress_week: "Неделя без стресса", course_reminder: "Напоминание о курсе", spring_return: "Возврат гостей весны",
  main: "Главная страница", autumn_care: "Осенний уход",
};

/** Собирает источник обращения из UTM-меток ссылки — для будущей маркетинговой аналитики */
export function attributionFrom(params: URLSearchParams, landing: string): Attribution {
  const us = params.get("utm_source") ?? "";
  const um = params.get("utm_medium") ?? "";
  const uc = params.get("utm_campaign") ?? "";
  const referrer = typeof document !== "undefined" && document.referrer ? new URL(document.referrer).hostname : "—";
  return {
    source: SOURCE_LABEL[us] ?? (us || "Прямая ссылка"),
    medium: MEDIUM_LABEL[um] ?? (um || "—"),
    campaign: CAMPAIGN_LABEL[uc] ?? (uc || "—"),
    material: MEDIUM_LABEL[um],
    utm_source: us || "—",
    utm_medium: um || "—",
    utm_campaign: uc || "—",
    landing_page: landing,
    referrer,
  };
}
