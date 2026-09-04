import type { Completions, Freezes } from '@/lib/habits';
import { isDone, isFrozen, isScheduled } from '@/lib/habits';
import { toDateKey } from '@/lib/date';
import type { Habit } from '@/types/habit';

export const bestStreakOf = (h: Habit, c: Completions, f: Freezes): number => {
  const start = new Date(h.createdAt);
  start.setHours(12, 0, 0, 0);
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  let best = 0;
  let cur = 0;
  const d = new Date(start);
  while (d.getTime() <= today.getTime()) {
    const key = toDateKey(d);
    const isToday = d.getTime() === today.getTime();
    if (isScheduled(h, d)) {
      if (isDone(c, h, key)) {
        cur++;
        if (cur > best) best = cur;
      } else if (!isToday && !isFrozen(f, h.id, key)) {
        cur = 0;
      }
    }
    d.setDate(d.getDate() + 1);
  }
  return best;
};

export const last30Totals = (habits: Habit[], c: Completions) => {
  const now = new Date();
  let done = 0;
  let total = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = toDateKey(d);
    const list = habits.filter((h) => isScheduled(h, d));
    total += list.length;
    done += list.filter((h) => isDone(c, h, key)).length;
  }
  return { done, total };
};

export const rate30 = (h: Habit, c: Completions) => {
  const now = new Date();
  let done = 0;
  let total = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    if (!isScheduled(h, d)) continue;
    total++;
    if (isDone(c, h, toDateKey(d))) done++;
  }
  return total > 0 ? Math.round((done / total) * 100) : 0;
};
