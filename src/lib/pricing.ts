/**
 * Стоимость путёвки: проживание в номере + лечение по программе.
 * Цена номера — «от» с сайта сети (за номер в ночь), лечение — за гостя в ночь. Демо-расчёт.
 */
export function stayPrice(roomPerNightRub: number, treatmentPerNightRub: number, nights: number, guests: number) {
  return Math.round(((roomPerNightRub + treatmentPerNightRub * guests) * nights) / 100) * 100;
}
