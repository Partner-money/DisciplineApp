import type { Completions } from '@/lib/completions';
import type { Freezes } from '@/store/habits';
import type { Habit, HabitType, TimeOfDay } from '@/types/habit';
import { WEEKDAYS_SHORT, fromKey, isSameDay, mondayIndex, timeNowMinutes, deadlineToMinutes, toDateKey } from '@/lib/date';

export type { Completions, Freezes };

export const TIME_ORDER: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'anytime'];

export const TIME_LABEL: Record<TimeOfDay, string> = {
  morning: 'Утро',
  afternoon: 'День',
  evening: 'Вечер',
  anytime: 'В любое время',
};

export const TYPE_LABEL: Record<HabitType, string> = {
  check: 'Галочка',
  count: 'Количество',
  duration: 'Время',
  measure: 'Своя единица',
};

export const typeIconOf = (t: HabitType): 'check' | 'hash' | 'clock' | 'tag' =>
  ({ check: 'check', count: 'hash', duration: 'clock', measure: 'tag' } as const)[t];

export const typeSummaryOf = (h: Habit) =>
  h.type === 'check' ? 'сделал — или нет' : `${h.target} ${h.unit} в день`;

export const isScheduled = (h: Habit, date: Date) =>
  h.days.length === 0 || h.days.includes(mondayIndex(date));

export const scheduledOn = (habits: Habit[], date: Date) =>
  habits.filter((h) => isScheduled(h, date));

export const entryOf = (c: Completions, habitId: string, key: string) => c[habitId]?.[key];

export const isDone = (c: Completions, h: Habit, key: string) => {
  const e = entryOf(c, h.id, key);
  if (!e) return false;
  return h.type === 'check' ? e.done : e.value >= (e.target ?? h.target);
};

export const isOverdue = (h: Habit, c: Completions, date: Date) => {
  if (!h.deadline || !isScheduled(h, date)) return false;
  const key = toDateKey(date);
  if (isDone(c, h, key)) return false;
  const now = new Date();
  if (isSameDay(now, date)) return timeNowMinutes() > deadlineToMinutes(h.deadline);
  return date.getTime() < now.getTime();
};

export const daysLabel = (days: number[]) =>
  days.length === 0
    ? 'Каждый день'
    : [...days].sort((a, b) => a - b).map((d) => WEEKDAYS_SHORT[d]).join(', ');

export const streakOf = (h: Habit, c: Completions, f: Freezes = {}): number => {
  const d = new Date();
  if (isScheduled(h, d) && !isDone(c, h, toDateKey(d))) d.setDate(d.getDate() - 1);
  let s = 0;
  for (let i = 0; i < 366 * 3; i++) {
    if (d.getTime() < h.createdAt) break;
    if (isScheduled(h, d)) {
      const key = toDateKey(d);
      if (isDone(c, h, key)) s++;
      else if (!isFrozen(f, h.id, key)) break;
    }
    d.setDate(d.getDate() - 1);
  }
  return s;
};

export const isFrozen = (f: Freezes, habitId: string, key: string) =>
  (f[habitId] ?? []).includes(key);

/** Календарных дней между датами. Полдень гасит переходы на зимнее и летнее время. */
const dayGap = (a: string, b: string) => {
  const da = fromKey(a);
  const db = fromKey(b);
  da.setHours(12, 0, 0, 0);
  db.setHours(12, 0, 0, 0);
  return Math.abs(Math.round((da.getTime() - db.getTime()) / 86400000));
};

export const canFreezeDay = (f: Freezes, habitId: string, key: string) =>
  !(f[habitId] ?? []).some((k) => dayGap(k, key) < 7);

export const freezesCount = (f: Freezes, habitId: string) => (f[habitId] ?? []).length;

export const monthStats = (habits: Habit[], c: Completions, y: number, m: number) => {
  const todayKey = toDateKey(new Date());
  const dim = new Date(y, m + 1, 0).getDate();
  let total = 0;
  let done = 0;
  for (let d = 1; d <= dim; d++) {
    const date = new Date(y, m, d);
    const key = toDateKey(date);
    if (key > todayKey) break;
    const list = scheduledOn(habits, date);
    total += list.length;
    done += list.filter((h) => isDone(c, h, key)).length;
  }
  return { total, done };
};

export const pluralDays = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
};

export const pluralHabits = (n: number) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'привычка';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'привычки';
  return 'привычек';
};
