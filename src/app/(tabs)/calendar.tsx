import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DaySheet } from '@/components/DaySheet';
import { HabitDetailSheet } from '@/components/HabitDetailSheet';
import { HabitFormSheet } from '@/components/HabitFormSheet';
import type { SheetHandle } from '@/components/Sheet';
import { useHabits } from '@/store/habits';
import { isDone, monthStats, scheduledOn } from '@/lib/habits';
import { WEEKDAYS_SHORT, daysInMonth, fromKey, mondayIndex, monthTitle, toDateKey } from '@/lib/date';
import type { Habit } from '@/types/habit';
import { fonts, habitColor, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

const CELL = '14.28%';

export default function CalendarScreen() {
  const p = usePalette();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const habits = useHabits((st) => st.habits);
  const completions = useHabits((st) => st.completions);
  const freezes = useHabits((st) => st.freezes);

  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Habit | null>(null);

  const dayRef = useRef<SheetHandle | null>(null);
  const detailRef = useRef<SheetHandle | null>(null);
  const formRef = useRef<SheetHandle | null>(null);

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const todayKey = toDateKey(today);

  const cells = useMemo(() => {
    const dim = daysInMonth(y, m);
    const lead = mondayIndex(new Date(y, m, 1));
    const arr: ({ day: number; date: Date; key: string } | null)[] = Array.from(
      { length: lead },
      () => null,
    );
    for (let d = 1; d <= dim; d++) {
      const date = new Date(y, m, d);
      arr.push({ day: d, date, key: toDateKey(date) });
    }
    return arr;
  }, [y, m]);

  const selectedHabits = useMemo(
    () => (selectedKey ? scheduledOn(habits, fromKey(selectedKey)) : []),
    [selectedKey, habits],
  );

  const detailHabit = habits.find((h) => h.id === detailId) ?? null;

  const stats = useMemo(() => monthStats(habits, completions, y, m), [habits, completions, y, m]);

  const shiftMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));

  const openDay = (key: string) => {
    setSelectedKey(key);
    dayRef.current?.open();
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: 40, paddingHorizontal: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.kicker}>Календарь</Text>
        <Text style={s.h1}>Твой месяц</Text>

        <View style={s.monthNav}>
          <Pressable onPress={() => shiftMonth(-1)} hitSlop={12} style={s.navBtn}>
            <Feather name="chevron-left" size={22} color={p.ink} />
          </Pressable>
          <Text style={s.monthTitle}>{monthTitle(cursor)}</Text>
          <Pressable onPress={() => shiftMonth(1)} hitSlop={12} style={s.navBtn}>
            <Feather name="chevron-right" size={22} color={p.ink} />
          </Pressable>
        </View>

        <View style={s.weekRow}>
          {WEEKDAYS_SHORT.map((w) => (
            <View key={w} style={s.weekCell}>
              <Text style={s.weekLabel}>{w}</Text>
            </View>
          ))}
        </View>

        <View style={s.grid}>
          {cells.map((cell, i) => {
            if (!cell) return <View key={`blank${i}`} style={{ width: CELL }} />;
            const list = scheduledOn(habits, cell.date);
            const done = list.filter((h) => isDone(completions, h, cell.key)).length;
            const allDone = list.length > 0 && done === list.length;
            const colors = Array.from(new Set(list.map((h) => habitColor(h.colorIndex)))).slice(0, 3);
            const isSelected = cell.key === selectedKey;
            const isToday = cell.key === todayKey;
            const isFuture = cell.key > todayKey;

            return (
              <Pressable
                key={cell.key}
                onPress={() => openDay(cell.key)}
                style={{ width: CELL, alignItems: 'center', paddingVertical: 4 }}
              >
                <View
                  style={[
                    s.dayCircle,
                    {
                      backgroundColor: isSelected ? p.ink : 'transparent',
                      borderWidth: isToday && !isSelected ? 1.5 : 0,
                      borderColor: p.accent,
                      opacity: isFuture ? 0.55 : 1,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 16,
                      color: isSelected ? p.bg : p.ink,
                    }}
                  >
                    {cell.day}
                  </Text>
                </View>
                <View style={s.dotsRow}>
                  {allDone ? (
                    <View style={[s.dot, { backgroundColor: p.success }]} />
                  ) : (
                    colors.map((c) => (
                      <View key={c} style={[s.dot, { backgroundColor: c, marginRight: 2 }]} />
                    ))
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={s.monthStats}>
          {stats.total > 0
            ? `В этом месяце: ${stats.done} из ${stats.total} выполнено`
            : 'Добавь привычки — и месяц расцветёт точками'}
        </Text>
      </ScrollView>

      <Pressable
        onPress={() => {
          setEditing(null);
          formRef.current?.open();
        }}
        style={[s.fab, { bottom: insets.bottom + 24 }]}
      >
        <Feather name="plus" size={28} color={p.onAccent} />
      </Pressable>

      <DaySheet
        sheetRef={dayRef}
        dateKey={selectedKey}
        habits={selectedHabits}
        completions={completions}
        freezes={freezes}
        onPick={(h) => {
          setDetailId(h.id);
          detailRef.current?.open();
        }}
      />
      <HabitDetailSheet
        sheetRef={detailRef}
        habit={detailHabit}
        dateKey={selectedKey ?? todayKey}
        onEdit={(h) => {
          setEditing(h);
          formRef.current?.open();
        }}
      />
      <HabitFormSheet sheetRef={formRef} editing={editing} />
    </View>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    kicker: {
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 2.4,
      textTransform: 'uppercase',
      color: p.accent,
    },
    h1: { fontFamily: fonts.displayBold, fontSize: 30, color: p.ink, marginTop: 4 },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 22,
      marginBottom: 10,
    },
    navBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: p.card,
      borderWidth: 1,
      borderColor: p.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthTitle: { fontFamily: fonts.display, fontSize: 22, color: p.ink },
    weekRow: { flexDirection: 'row', marginBottom: 6 },
    weekCell: { width: '14.28%', alignItems: 'center' },
    weekLabel: { fontFamily: fonts.bold, fontSize: 11, letterSpacing: 1, color: p.muted },
    grid: { flexDirection: 'row', flexWrap: 'wrap' },
    dayCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      borderColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dotsRow: { flexDirection: 'row', height: 8, marginTop: 3, alignItems: 'center' },
    dot: { width: 6, height: 6, borderRadius: 3 },
    monthStats: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: p.muted,
      textAlign: 'center',
      marginTop: 18,
    },
    fab: {
      position: 'absolute',
      right: 24,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: p.accent,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    },
  });
