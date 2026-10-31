/**
 * Детерминированный генератор случайных чисел: фиксированный seed —
 * каждый запуск прототипа показывает одни и те же данные.
 */
export function rng(seed: string) {
  let h = 1779033703;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
  const next = () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  return {
    next,
    /** Целое в диапазоне [min, max] */
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)],
    chance: (p: number) => next() < p,
    /** Выбор по весам: [[значение, вес], …] */
    weighted: <T,>(list: readonly (readonly [T, number])[]) => {
      const total = list.reduce((s, [, w]) => s + w, 0);
      let r = next() * total;
      for (const [v, w] of list) if ((r -= w) < 0) return v;
      return list[list.length - 1][0];
    },
    shuffle: <T,>(list: readonly T[]) => {
      const a = [...list];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

export type Rng = ReturnType<typeof rng>;
