import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useHabits } from '@/store/habits';
import { isDone, isOverdue, typeIconOf } from '@/lib/habits';
import { deadlineToMinutes, isSameDay, timeNowMinutes, toDateKey } from '@/lib/date';
import type { DayEntry, Habit } from '@/types/habit';
import { fonts, habitColor, onHabitColor, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

type Props = {
  habit: Habit;
  entry?: DayEntry;
  date: Date;
  onOpen: () => void;
};

const haptic = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

export function HabitCard({ habit, entry, date, onOpen }: Props) {
  const p = usePalette();
  const card = useThemedStyles(makeStyles);
  const setProgress = useHabits((s) => s.setProgress);
  const toggleCheck = useHabits((s) => s.toggleCheck);
  const completions = useHabits((s) => s.completions);

  const key = toDateKey(date);
  const color = habitColor(habit.colorIndex);
  const done = isDone(completions, habit, key);
  const value = entry?.value ?? 0;
  const overdue = isOverdue(habit, completions, date);
  const beforeWindow =
    !!habit.windowStart &&
    !done &&
    isSameDay(new Date(), date) &&
    timeNowMinutes() < deadlineToMinutes(habit.windowStart);
  const progressPct = habit.type === 'check' ? 0 : Math.min(100, (value / habit.target) * 100);

  return (
    <Pressable onPress={onOpen} style={card.wrap}>
      {habit.type === 'check' ? (
        <Pressable
          hitSlop={10}
          onPress={() => {
            haptic();
            toggleCheck(habit.id, key);
          }}
          style={[
            card.circle,
            { borderColor: done ? color : p.line, backgroundColor: done ? color : 'transparent' },
          ]}
        >
          {done && <Feather name="check" size={22} color={onHabitColor} />}
        </Pressable>
      ) : (
        <View style={[card.circle, { backgroundColor: `${color}26` }]}>
          <Feather name={typeIconOf(habit.type)} size={18} color={color} />
        </View>
      )}

      <View style={card.center}>
        <Text numberOfLines={2} style={[card.title, done && card.doneTitle]}>
          {habit.title}
        </Text>
        {habit.type !== 'check' && (
          <Text style={card.sub}>
            {value} / {habit.target} {habit.unit}
          </Text>
        )}
      </View>

      <View style={card.right}>
        {done ? (
          <Feather name="check-circle" size={22} color={p.success} />
        ) : beforeWindow ? (
          <Text style={card.deadline}>с {habit.windowStart}</Text>
        ) : overdue ? (
          <Text style={card.overdue}>Просрочено</Text>
        ) : habit.deadline ? (
          <Text style={card.deadline}>до {habit.deadline}</Text>
        ) : null}
        {habit.type !== 'check' && !done && (
          <Pressable
            hitSlop={10}
            onPress={() => {
              haptic();
              setProgress(habit.id, key, value + 1);
            }}
            style={card.plus}
          >
            <Feather name="plus" size={20} color={p.accent} />
          </Pressable>
        )}
      </View>

      {habit.type !== 'check' && (
        <View style={[card.track, { marginTop: 12 }]}>
          <View style={[card.fill, { width: `${progressPct}%`, backgroundColor: color }]} />
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      backgroundColor: p.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: p.line,
      padding: 16,
      marginBottom: 12,
    },
    circle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    center: { flex: 1, marginRight: 10 },
    title: { fontFamily: fonts.semibold, fontSize: 16, color: p.ink },
    doneTitle: { textDecorationLine: 'line-through', color: p.muted },
    sub: { fontFamily: fonts.medium, fontSize: 13, color: p.muted, marginTop: 2 },
    right: { alignItems: 'flex-end' },
    overdue: { fontFamily: fonts.semibold, fontSize: 12, color: p.danger },
    deadline: { fontFamily: fonts.medium, fontSize: 12, color: p.muted },
    plus: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: p.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 6,
    },
    track: { width: '100%', height: 6, borderRadius: 3, backgroundColor: p.line },
    fill: { height: 6, borderRadius: 3 },
  });
