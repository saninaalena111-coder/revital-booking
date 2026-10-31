/**
 * assistantService — ИИ-помощник по системе (демо).
 *
 * В прототипе без внешнего ИИ: ответ ищется по базе знаний справки — ключевые слова
 * и синонимы, сравнение по основе слова (первые буквы), бонус статьям своей роли.
 * РЕАЛЬНЫЙ API: POST /assistant/ask — модель, обученная на полной документации
 * системы и развёрнутая на сервере компании (данные не уходят наружу).
 */
import type { RoleId } from "@/lib/types";
import { HELP, type HelpArticle } from "@/config/help";
import { latency } from "./config";

const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/[^a-zа-я0-9\s]/g, " ");
/** Грубая основа слова: «выписку», «выписка», «выписной» → «выпис» */
const stem = (w: string) => (w.length > 5 ? w.slice(0, Math.max(5, w.length - 3)) : w);
const words = (s: string) => norm(s).split(/\s+/).filter((w) => w.length > 2);

const STOP = new Set(["как", "где", "что", "мне", "для", "это", "или", "нужно", "можно", "надо", "есть", "если", "чтобы", "при", "все"]);

export interface AssistantAnswer {
  article: HelpArticle | null;
  related: HelpArticle[];
}

function score(article: HelpArticle, query: string[], role?: RoleId) {
  const keys = article.keywords.map((k) => stem(norm(k)));
  const title = words(article.title).map(stem);
  let s = 0;
  for (const q of query) {
    const qs = stem(q);
    if (keys.some((k) => k.startsWith(qs) || qs.startsWith(k))) s += 3;
    else if (title.some((t) => t.startsWith(qs) || qs.startsWith(t))) s += 1;
  }
  if (s > 0 && role && article.roles?.includes(role)) s += 1;
  return s;
}

export const assistantService = {
  /** Готовые вопросы для старта разговора — под роль сотрудника */
  suggestions(role?: RoleId): string[] {
    const byRole: Partial<Record<RoleId, string[]>> = {
      doctor: ["Как оформить выписку?", "Как диктовать голосом?", "Документ вернулся с ошибкой"],
      nurse: ["Как отметить процедуру?", "Как перенести процедуру?", "Как отменить процедуру?"],
      reception: ["Как заселить гостя?", "Как создать бронь?", "Иностранный гость"],
      booking: ["Как создать бронь?", "Как записать гостя к врачу?"],
      restaurant: ["Как заказать питание за гостя?", "Где сводка для кухни?"],
      manager: ["Где загрузка и выручка?", "Откуда приходят гости?", "Кто открывал карту гостя?"],
      marketer: ["Откуда приходят гости?", "Как сменить роль?"],
      sysadmin: ["Как добавить сотрудника?", "Кто открывал карту гостя?", "Как работает вход в два шага?"],
    };
    return byRole[role ?? "doctor"] ?? ["Как оформить выписку?", "Как заселить гостя?"];
  },

  async ask(question: string, role?: RoleId): Promise<AssistantAnswer> {
    await latency(650);
    const q = words(question).filter((w) => !STOP.has(w));
    const ranked = HELP.map((a) => ({ a, s: score(a, q, role) })).filter((x) => x.s >= 3).sort((x, y) => y.s - x.s);
    return { article: ranked[0]?.a ?? null, related: ranked.slice(1, 3).map((x) => x.a) };
  },

  articles: () => HELP,
};
