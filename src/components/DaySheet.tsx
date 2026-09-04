import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Sheet, type SheetHandle } from '@/components/Sheet';
import type { Completions, Freezes } from '@/lib/habits';
import { entryOf, isDone, isFrozen, isOverdue } from '@/lib/habits';
import { dayShort, fromKey, weekdayFull } from '@/lib/date';
import type { Habit } from '@/types/habit';
import { fonts, habitColor, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

type Props = {
  sheetRef: React.RefObject<SheetHandle | null>;
  dateKey: string | null;
  habits: Habit[];
  completions: Completions;
  freezes: Freezes;
  onPick: (habit: Habit) => void;
};

const statusOf = (
  h: Habit,
  c: Completions,
  f: Freezes,
  key: string,
  date: Date,
  p: Palette,
) => {
  if (isDone(c, h, key)) return { text: 'Выполнено', color: p.success };
  if (isFrozen(f, h.id, key)) return { text: 'Заморожен', color: p.accent };
  if (isOverdue(h, c, date)) return { text: 'Просрочено', color: p.danger };
  const e = entryOf(c, h.id, key);
  if (e && e.value > 0) return { text: `${e.value} / ${h.target} ${h.unit}`, color: p.ink };
  return { text: 'Запланировано', color: p.muted };
};

export function DaySheet({ sheetRef, dateKey, habits, completions, freezes, onPick }: Props) {
  const p = usePalette();
  const s = useThemedStyles(makeStyles);
  if (!dateKey) return null;
  const date = fromKey(dateKey);
  const list = habits;

  return (
    <Sheet sheetRef={sheetRef} maxHeightFactor={0.7}>
      <Text style={s.date}>{dayShort(date)}</Text>
      <Text style={s.weekday}>{weekdayFull(date)}</Text>

      {list.length === 0 ? (
        <View style={s.empty}>
          <Feather name="coffee" size={30} color={p.accent} />
          <Text style={s.emptyTitle}>Дел на этот день нет</Text>
          <Text style={s.emptyHint}>Здесь появятся привычки по расписанию</Text>
        </View>
      ) : (
        <View style={{ marginTop: 16 }}>
          {list.map((h) => {
            const status = statusOf(h, completions, freezes, dateKey, date, p);
            const done = isDone(completions, h, dateKey);
            return (
              <Pressable key={h.id} onPress={() => onPick(h)} style={s.row}>
                <View style={[s.dot, { backgroundColor: habitColor(h.colorIndex) }]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    numberOfLines={2}
                    style={[s.rowTitle, done && { color: p.muted, textDecorationLine: 'line-through' }]}
                  >
                    {h.title}
                  </Text>
                  <Text
                    style={{ fontFamily: fonts.medium, fontSize: 12, color: status.color, marginTop: 2 }}
                  >
                    {status.text}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color={p.line} />
              </Pressable>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    date: { fontFamily: fonts.displayBold, fontSize: 26, color: p.ink },
    weekday: { fontFamily: fonts.medium, fontSize: 14, color: p.muted, marginTop: 2 },
    empty: {
      alignItems: 'center',
      backgroundColor: p.bg,
      borderRadius: 20,
      padding: 26,
      marginTop: 16,
    },
    emptyTitle: { fontFamily: fonts.display, fontSize: 19, color: p.ink, marginTop: 10 },
    emptyHint: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: p.muted,
      marginTop: 4,
      textAlign: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.bg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 10,
    },
    dot: { width: 11, height: 11, borderRadius: 6 },
    rowTitle: { fontFamily: fonts.semibold, fontSize: 15, color: p.ink },
  });
