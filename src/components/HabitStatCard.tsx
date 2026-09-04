import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Completions, Freezes } from '@/lib/habits';
import { isDone, isScheduled, pluralDays, streakOf } from '@/lib/habits';
import { rate30 } from '@/lib/stats';
import { toDateKey } from '@/lib/date';
import type { Habit } from '@/types/habit';
import { fonts, habitColor, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

const BAR_DAYS = 14;

type Props = {
  habit: Habit;
  completions: Completions;
  freezes: Freezes;
  onPress: () => void;
};

export function HabitStatCard({ habit, completions, freezes, onPress }: Props) {
  const p = usePalette();
  const s = useThemedStyles(makeStyles);
  const color = habitColor(habit.colorIndex);
  const streak = streakOf(habit, completions, freezes);
  const percent = useMemo(() => rate30(habit, completions), [habit, completions]);

  const bars = useMemo(() => {
    const now = new Date();
    const arr: ('done' | 'miss' | 'off')[] = [];
    for (let i = BAR_DAYS - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      if (!isScheduled(habit, d)) {
        arr.push('off');
        continue;
      }
      arr.push(isDone(completions, habit, toDateKey(d)) ? 'done' : 'miss');
    }
    return arr;
  }, [habit, completions]);

  return (
    <Pressable onPress={onPress} style={s.wrap}>
      <View style={s.head}>
        <View style={[s.dot, { backgroundColor: color }]} />
        <Text numberOfLines={1} style={s.title}>
          {habit.title}
        </Text>
        <Text style={[s.streak, { color: streak > 0 ? p.accentDeep : p.muted }]}>
          {streak > 0 ? `${streak} ${pluralDays(streak)}` : 'нет серии'}
        </Text>
      </View>
      <View style={s.bars}>
        {bars.map((b, i) => (
          <View
            key={i}
            style={[
              s.bar,
              { backgroundColor: b === 'done' ? color : b === 'miss' ? p.line : 'transparent' },
            ]}
          />
        ))}
      </View>
      <View style={s.footer}>
        <Text style={s.footerLabel}>последние 14 дней</Text>
        <Text style={s.footerPct}>{percent}% за месяц</Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    wrap: {
      backgroundColor: p.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: p.line,
      padding: 16,
      marginBottom: 12,
    },
    head: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 11, height: 11, borderRadius: 6, marginRight: 10 },
    title: { flex: 1, fontFamily: fonts.semibold, fontSize: 16, color: p.ink },
    streak: { fontFamily: fonts.semibold, fontSize: 13, marginLeft: 8 },
    bars: { flexDirection: 'row', marginTop: 14 },
    bar: { flex: 1, height: 30, borderRadius: 3, marginHorizontal: 1.5 },
    footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    footerLabel: { fontFamily: fonts.medium, fontSize: 11, color: p.muted },
    footerPct: { fontFamily: fonts.semibold, fontSize: 11, color: p.accentDeep },
  });
