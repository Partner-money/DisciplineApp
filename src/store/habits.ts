import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Completions } from '@/lib/completions';
import { canFreezeDay, isFrozen } from '@/lib/habits';
import { toDateKey } from '@/lib/date';
import type { DayEntry, Habit } from '@/types/habit';

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export type NewHabit = Omit<Habit, 'id' | 'createdAt'>;

export type Freezes = Record<string, string[]>;

/**
 * Пересобирает запись дня под текущий тип и цель привычки.
 * Применяется только к сегодняшнему дню: прошлое хранит свою цель и не переписывается.
 */
const restamp = (entry: DayEntry, habit: Habit): DayEntry => {
  if (habit.type === 'check') {
    return { value: entry.done ? 1 : 0, done: entry.done, completedAt: entry.completedAt };
  }
  const done = entry.value >= habit.target;
  return {
    value: entry.value,
    done,
    target: habit.target,
    completedAt: done ? entry.completedAt ?? Date.now() : null,
  };
};

interface HabitsStore {
  habits: Habit[];
  completions: Completions;
  freezes: Freezes;
  addHabit: (data: NewHabit) => Habit;
  updateHabit: (id: string, data: NewHabit) => Habit | null;
  removeHabit: (id: string) => void;
  setProgress: (id: string, dateKey: string, value: number) => void;
  toggleCheck: (id: string, dateKey: string) => void;
  freezeDay: (id: string, dateKey: string) => void;
  resetAll: () => void;
}

export const useHabits = create<HabitsStore>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: {},
      freezes: {},
      addHabit: (data) => {
        const habit: Habit = { ...data, id: uid(), createdAt: Date.now() };
        set((s) => ({ habits: [...s.habits, habit] }));
        return habit;
      },
      updateHabit: (id, data) => {
        const existing = get().habits.find((h) => h.id === id);
        if (!existing) return null;
        const updated: Habit = { ...existing, ...data, id, createdAt: existing.createdAt };
        const goalChanged = updated.target !== existing.target || updated.type !== existing.type;
        set((s) => {
          const habits = s.habits.map((h) => (h.id === id ? updated : h));
          if (!goalChanged) return { habits };
          const key = toDateKey(new Date());
          const entry = s.completions[id]?.[key];
          if (!entry) return { habits };
          return {
            habits,
            completions: {
              ...s.completions,
              [id]: { ...(s.completions[id] ?? {}), [key]: restamp(entry, updated) },
            },
          };
        });
        return updated;
      },
      removeHabit: (id) =>
        set((s) => {
          const completions = { ...s.completions };
          delete completions[id];
          const freezes = { ...s.freezes };
          delete freezes[id];
          return { habits: s.habits.filter((h) => h.id !== id), completions, freezes };
        }),
      setProgress: (id, dateKey, value) =>
        set((s) => {
          const habit = s.habits.find((h) => h.id === id);
          if (!habit) return {};
          const v = Math.max(0, Math.round(value));
          const done = habit.type !== 'check' && v >= habit.target;
          const prev = s.completions[id]?.[dateKey];
          const entry: DayEntry = {
            value: v,
            done,
            completedAt: done ? prev?.completedAt ?? Date.now() : null,
            ...(habit.type === 'check' ? {} : { target: habit.target }),
          };
          return {
            completions: {
              ...s.completions,
              [id]: { ...(s.completions[id] ?? {}), [dateKey]: entry },
            },
          };
        }),
      toggleCheck: (id, dateKey) =>
        set((s) => {
          const prev = s.completions[id]?.[dateKey];
          const done = !(prev?.done ?? false);
          const entry: DayEntry = {
            value: done ? 1 : 0,
            done,
            completedAt: done ? Date.now() : null,
          };
          return {
            completions: {
              ...s.completions,
              [id]: { ...(s.completions[id] ?? {}), [dateKey]: entry },
            },
          };
        }),
      freezeDay: (id, dateKey) =>
        set((s) => {
          // правило живёт здесь, а не в UI: иначе его можно обойти
          if (isFrozen(s.freezes, id, dateKey)) return {};
          if (!canFreezeDay(s.freezes, id, dateKey)) return {};
          return {
            freezes: { ...s.freezes, [id]: [...(s.freezes[id] ?? []), dateKey] },
          };
        }),
      resetAll: () => set({ habits: [], completions: {}, freezes: {} }),
    }),
    {
      name: 'discipline-store-v1',
      version: 3,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (persisted) => {
        const p = (persisted ?? {}) as Partial<{
          habits: Partial<Habit>[];
          completions: Completions;
          freezes: Freezes;
        }>;
        const habits = (p.habits ?? []).map((raw) => ({
          windowStart: null,
          reminder: false,
          reminderTime: null,
          ...raw,
        })) as Habit[];

        // v3: запись дня хранит цель, действовавшую в момент отметки. Для старых
        // записей таких данных нет — проставляем текущую цель привычки, чтобы
        // история застыла один раз и дальше уже не переписывалась.
        const completions: Completions = { ...(p.completions ?? {}) };
        for (const habit of habits) {
          if (habit.type === 'check') continue;
          const days = completions[habit.id];
          if (!days) continue;
          const stamped: Record<string, DayEntry> = {};
          for (const [key, entry] of Object.entries(days)) {
            stamped[key] = entry.target === undefined ? { ...entry, target: habit.target } : entry;
          }
          completions[habit.id] = stamped;
        }

        return { habits, completions, freezes: p.freezes ?? {} } as HabitsStore;
      },
    },
  ),
);
