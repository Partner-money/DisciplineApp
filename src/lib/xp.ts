import { isDone, scheduledOn } from '@/lib/habits';
import type { Completions } from '@/lib/completions';
import { fromKey } from '@/lib/date';
import type { Habit } from '@/types/habit';

export const XP_PER_DAY = 10;
export const XP_PERFECT_DAY = 5;

const TITLES = [
  'Новичок',
  'Ученик',
  'Практик',
  'Упорный',
  'Стойкий',
  'Мастер',
  'Наставник',
  'Легенда',
] as const;

export const titleOf = (level: number) => TITLES[Math.min(level, TITLES.length) - 1];

/**
 * Сколько всего опыта нужно, чтобы достичь уровня: каждый следующий уровень
 * дороже предыдущего на 100 XP. Уровень 1 — 0, второй — 100, третий — 300.
 */
export const cumulativeXpFor = (level: number) => 50 * (level - 1) * level;

export const levelFromXp = (xp: number) => {
  let level = 1;
  while (cumulativeXpFor(level + 1) <= xp) level++;
  return level;
};

/**
 * Опыт не хранится, а считается из истории выполнения. Значит, он не может
 * разойтись с данными и обнуляется вместе со сбросом сам собой.
 *
 * Выполненные дни считаются все, даже если привычку потом переставили на другие
 * дни недели: опыт, который уже заработан, отнимать нельзя.
 */
export const totalXp = (habits: Habit[], c: Completions): number => {
  if (habits.length === 0) return 0;
  const byId = new Map(habits.map((h) => [h.id, h]));
  const touchedDays = new Set<string>();
  let doneDays = 0;

  for (const [habitId, days] of Object.entries(c)) {
    const habit = byId.get(habitId);
    if (!habit) continue;
    for (const key of Object.keys(days)) {
      if (!isDone(c, habit, key)) continue;
      doneDays++;
      touchedDays.add(key);
    }
  }

  let perfectDays = 0;
  for (const key of touchedDays) {
    const list = scheduledOn(habits, fromKey(key));
    if (list.length > 0 && list.every((h) => isDone(c, h, key))) perfectDays++;
  }

  return doneDays * XP_PER_DAY + perfectDays * XP_PERFECT_DAY;
};

export interface LevelProgress {
  level: number;
  title: string;
  xp: number;
  /** Опыт, набранный внутри текущего уровня. */
  into: number;
  /** Сколько опыта стоит текущий уровень целиком. */
  need: number;
  /** Доля пройденного до следующего уровня, 0…1. */
  ratio: number;
}

export const levelProgress = (xp: number): LevelProgress => {
  const level = levelFromXp(xp);
  const base = cumulativeXpFor(level);
  const next = cumulativeXpFor(level + 1);
  const need = next - base;
  const into = xp - base;
  return {
    level,
    title: titleOf(level),
    xp,
    into,
    need,
    ratio: need > 0 ? into / need : 1,
  };
};
