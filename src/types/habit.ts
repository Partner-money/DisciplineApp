export type HabitType = 'check' | 'count' | 'duration' | 'measure';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Habit {
  id: string;
  title: string;
  type: HabitType;
  target: number;
  unit: string;
  colorIndex: number;
  days: number[];
  timeOfDay: TimeOfDay;
  deadline: string | null;
  windowStart: string | null;
  reminder: boolean;
  reminderTime: string | null;
  manifesto: string | null;
  createdAt: number;
}

export interface DayEntry {
  value: number;
  done: boolean;
  /** Цель, действовавшая в момент записи. У «галочки» цели нет. */
  target?: number;
  completedAt: number | null;
}
