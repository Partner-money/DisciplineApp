import * as Notifications from 'expo-notifications';
import type { Habit } from '@/types/habit';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return !!req.granted;
  } catch {
    return false;
  }
}

export async function hasPermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    return !!cur.granted;
  } catch {
    return false;
  }
}

const identifiersFor = (habitId: string) => [
  `habit-${habitId}-d`,
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => `habit-${habitId}-w${i}`),
];

export async function cancelHabitNotifications(habitId: string) {
  await Promise.all(
    identifiersFor(habitId).map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined),
    ),
  );
}

export async function syncHabitNotifications(habit: Habit) {
  await cancelHabitNotifications(habit.id);
  if (!habit.reminder || !habit.reminderTime) return;  const [h, m] = habit.reminderTime.split(':').map(Number);
  const body = habit.deadline ? `Дедлайн в ${habit.deadline}` : 'Пора действовать';
  const content: Notifications.NotificationContentInput = {
    title: habit.title,
    body,
    sound: 'default',
  };
  try {
    if (habit.days.length === 0) {
      await Notifications.scheduleNotificationAsync({
        identifier: `habit-${habit.id}-d`,
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
      });
    } else {
      await Promise.all(
        habit.days.map((d) =>
          Notifications.scheduleNotificationAsync({
            identifier: `habit-${habit.id}-w${d}`,
            content,
            // weekly weekday: 1 = воскресенье … 7 = суббота; у нас 0 = понедельник
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: d === 6 ? 1 : d + 2,
              hour: h,
              minute: m,
            },
          }),
        ),
      );
    }
  } catch {
    // планирование может быть недоступно в Expo Go на некоторых платформах
  }
}

/**
 * Приводит расписание пушей в соответствие со стором: снимает всё лишнее и планирует
 * недостающее. Расписание перестаёт быть отдельным состоянием, которое можно забыть
 * обновить — любой путь, меняющий привычки, лечится следующим вызовом.
 *
 * Отменяет только свои уведомления (префикс `habit-`), а не всё подряд.
 */
export async function reconcileNotifications(habits: Habit[]) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.identifier.startsWith('habit-'))
        .map((n) =>
          Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => undefined),
        ),
    );
    for (const habit of habits) {
      if (habit.reminder && habit.reminderTime) await syncHabitNotifications(habit);
    }
  } catch {
    // планирование может быть недоступно в Expo Go на некоторых платформах
  }
}
