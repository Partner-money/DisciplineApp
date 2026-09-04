import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Sheet, type SheetHandle } from '@/components/Sheet';
import { InfoRow } from '@/components/ui';
import { useHabits } from '@/store/habits';
import {
  TYPE_LABEL,
  TIME_LABEL,
  canFreezeDay,
  daysLabel,
  freezesCount,
  isDone,
  isFrozen,
  isScheduled,
  pluralDays,
  streakOf,
  typeIconOf,
  typeSummaryOf,
} from '@/lib/habits';
import { cancelHabitNotifications } from '@/lib/notifications';
import { dayShort, fromKey, toDateKey } from '@/lib/date';
import type { Habit } from '@/types/habit';
import { fonts, habitColor, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

type Props = {
  sheetRef: React.RefObject<SheetHandle | null>;
  habit: Habit | null;
  dateKey: string;
  onEdit?: (habit: Habit) => void;
};

const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export function HabitDetailSheet({ sheetRef, habit, dateKey, onEdit }: Props) {
  const p = usePalette();
  const s = useThemedStyles(makeStyles);
  const completions = useHabits((st) => st.completions);
  const freezes = useHabits((st) => st.freezes);
  const setProgress = useHabits((st) => st.setProgress);
  const toggleCheck = useHabits((st) => st.toggleCheck);
  const freezeDay = useHabits((st) => st.freezeDay);
  const removeHabit = useHabits((st) => st.removeHabit);

  if (!habit) return null;

  const color = habitColor(habit.colorIndex);
  const entry = completions[habit.id]?.[dateKey];
  const value = entry?.value ?? 0;
  const target = entry?.target ?? habit.target;
  const done = isDone(completions, habit, dateKey);
  const streak = streakOf(habit, completions, freezes);
  const steps = habit.type === 'duration' ? [5, 15, 30] : [1, 5, 10];

  const date = fromKey(dateKey);
  const isPastDay = dateKey < toDateKey(new Date());
  const frozen = isFrozen(freezes, habit.id, dateKey);
  const missedPastDay = isPastDay && isScheduled(habit, date) && !done;
  const freezeAllowed = canFreezeDay(freezes, habit.id, dateKey);

  const addValue = (n: number) => {
    haptic();
    setProgress(habit.id, dateKey, value + n);
  };

  const applyFreeze = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    freezeDay(habit.id, dateKey);
  };

  const confirmDelete = () => {
    Alert.alert('Удалить привычку?', `«${habit.title}» и вся её история исчезнут безвозвратно.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          void cancelHabitNotifications(habit.id);
          removeHabit(habit.id);
          sheetRef.current?.close();
        },
      },
    ]);
  };

  return (
    <Sheet sheetRef={sheetRef} maxHeightFactor={0.85}>
      <View style={s.head}>
        <View style={[s.icon, { backgroundColor: `${color}26` }]}>
          <Feather name={typeIconOf(habit.type)} size={20} color={color} />
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.title}>{habit.title}</Text>
          <Text style={s.subtitle}>{typeSummaryOf(habit)}</Text>
        </View>
        {onEdit && (
          <Pressable onPress={() => onEdit(habit)} style={s.editBtn}>
            <Feather name="edit-2" size={18} color={p.accent} />
          </Pressable>
        )}
      </View>

      <View style={s.progressCard}>
        <Text style={s.progressLabel}>Прогресс за {dayShort(date)}</Text>
        {habit.type === 'check' ? (
          <Pressable
            onPress={() => {
              haptic();
              toggleCheck(habit.id, dateKey);
            }}
            style={[s.actionBtn, { backgroundColor: done ? p.line : p.accent }]}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: done ? p.ink : p.onAccent }}>
              {done ? 'Снять отметку' : 'Отметить выполнение'}
            </Text>
          </Pressable>
        ) : (
          <>
            <Text style={s.progressValue}>
              {value}
              <Text style={s.progressTarget}>
                {' '}
                / {target} {habit.unit}
              </Text>
            </Text>
            <View style={s.track}>
              <View
                style={[
                  s.fill,
                  { width: `${Math.min(100, (value / target) * 100)}%`, backgroundColor: color },
                ]}
              />
            </View>
            <View style={s.stepsRow}>
              {steps.map((n) => (
                <Pressable key={n} onPress={() => addValue(n)} style={s.stepBtn}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: p.accentDeep }}>
                    +{n} {habit.unit}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>

      {missedPastDay &&
        (frozen ? (
          <View style={[s.freezeCard, { backgroundColor: p.accentSoft }]}>
            <Feather name="shield" size={18} color={p.accentDeep} />
            <Text style={s.freezeTextActive}>День заморожен — серия сохранена</Text>
          </View>
        ) : (
          <Pressable
            onPress={freezeAllowed ? applyFreeze : undefined}
            style={[
              s.freezeCard,
              freezeAllowed
                ? { backgroundColor: p.elevated }
                : { borderColor: p.line, borderWidth: 1, backgroundColor: 'transparent', opacity: 0.7 },
            ]}
          >
            <Feather name="shield" size={18} color={freezeAllowed ? p.ink : p.muted} />
            <Text style={freezeAllowed ? s.freezeText : s.freezeTextDisabled}>
              {freezeAllowed
                ? 'Заморозить день — страховка серии'
                : 'Заморозка недоступна: 1 раз в 7 дней'}
            </Text>
          </Pressable>
        ))}

      <View style={s.infoCard}>
        <InfoRow label="Тип" value={TYPE_LABEL[habit.type]} />
        <InfoRow label="Повторение" value={daysLabel(habit.days)} />
        <InfoRow label="Время дня" value={TIME_LABEL[habit.timeOfDay]} />
        <InfoRow
          label="Окно"
          value={
            habit.windowStart && habit.deadline
              ? `с ${habit.windowStart} до ${habit.deadline}`
              : habit.deadline
                ? `до ${habit.deadline}`
                : habit.windowStart
                  ? `с ${habit.windowStart}`
                  : 'не задано'
          }
        />
        <InfoRow
          label="Напоминание"
          value={habit.reminder && habit.reminderTime ? `в ${habit.reminderTime}` : 'выкл'}
        />
        <InfoRow
          label="Серия"
          value={streak > 0 ? `${streak} ${pluralDays(streak)} подряд` : 'пока 0'}
        />
        {freezesCount(freezes, habit.id) > 0 && (
          <InfoRow
            label="Заморозок"
            value={`${freezesCount(freezes, habit.id)} ${freezesCount(freezes, habit.id) === 1 ? 'день' : 'дн.'}`}
          />
        )}
      </View>

      {habit.manifesto ? (
        <View style={s.manifesto}>
          <Text style={s.manifestoLabel}>Зачем</Text>
          <Text style={s.manifestoText}>«{habit.manifesto}»</Text>
        </View>
      ) : null}

      <Pressable onPress={confirmDelete} style={s.deleteBtn}>
        <Feather name="trash-2" size={17} color={p.danger} />
        <Text style={{ fontFamily: fonts.semibold, fontSize: 15, color: p.danger, marginLeft: 8 }}>
          Удалить привычку
        </Text>
      </Pressable>
    </Sheet>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    head: { flexDirection: 'row', alignItems: 'center' },
    icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    title: { fontFamily: fonts.displayBold, fontSize: 24, color: p.ink, flexShrink: 1 },
    subtitle: { fontFamily: fonts.medium, fontSize: 13, color: p.muted, marginTop: 2 },
    editBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: p.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: 8,
    },
    progressCard: { backgroundColor: p.bg, borderRadius: 20, padding: 18, marginTop: 20 },
    progressLabel: {
      fontFamily: fonts.bold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: p.muted,
    },
    actionBtn: { borderRadius: 14, alignItems: 'center', paddingVertical: 14, marginTop: 12 },
    progressValue: { fontFamily: fonts.displayBold, fontSize: 32, color: p.ink, marginTop: 8 },
    progressTarget: { fontFamily: fonts.display, fontSize: 18, color: p.muted },
    track: { height: 8, borderRadius: 4, backgroundColor: p.line, marginTop: 10 },
    fill: { height: 8, borderRadius: 4 },
    stepsRow: { flexDirection: 'row', marginTop: 12 },
    stepBtn: {
      backgroundColor: p.accentSoft,
      borderRadius: 999,
      paddingHorizontal: 16,
      paddingVertical: 9,
      marginRight: 8,
    },
    freezeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 18,
      padding: 16,
      marginTop: 14,
    },
    freezeText: { fontFamily: fonts.semibold, fontSize: 14, color: p.ink, marginLeft: 10, flex: 1 },
    freezeTextActive: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      color: p.accentDeep,
      marginLeft: 10,
      flex: 1,
    },
    freezeTextDisabled: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: p.muted,
      marginLeft: 10,
      flex: 1,
    },
    infoCard: { borderRadius: 20, borderWidth: 1, borderColor: p.line, padding: 18, marginTop: 14 },
    manifesto: { backgroundColor: p.accentSoft, borderRadius: 20, padding: 18, marginTop: 14 },
    manifestoLabel: {
      fontFamily: fonts.bold,
      fontSize: 11,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: p.accentDeep,
    },
    manifestoText: {
      fontFamily: fonts.medium,
      fontSize: 15,
      color: p.ink,
      fontStyle: 'italic',
      marginTop: 6,
      lineHeight: 22,
    },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: p.dangerSoft,
      paddingVertical: 14,
      marginTop: 14,
      marginBottom: 6,
    },
  });
