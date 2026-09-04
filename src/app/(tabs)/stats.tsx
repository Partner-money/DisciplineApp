import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { YearHeatmap } from '@/components/YearHeatmap';
import { HabitStatCard } from '@/components/HabitStatCard';
import { DaySheet } from '@/components/DaySheet';
import { HabitDetailSheet } from '@/components/HabitDetailSheet';
import type { SheetHandle } from '@/components/Sheet';
import { useHabits } from '@/store/habits';
import { scheduledOn } from '@/lib/habits';
import { last30Totals } from '@/lib/stats';
import { fromKey, toDateKey } from '@/lib/date';
import { fonts, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

export default function StatsScreen() {
  const p = usePalette();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const habits = useHabits((st) => st.habits);
  const completions = useHabits((st) => st.completions);
  const freezes = useHabits((st) => st.freezes);

  const dayRef = useRef<SheetHandle | null>(null);
  const detailRef = useRef<SheetHandle | null>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const todayKey = toDateKey(new Date());
  const detailHabit = habits.find((h) => h.id === detailId) ?? null;
  const dayHabits = useMemo(
    () => (dayKey ? scheduledOn(habits, fromKey(dayKey)) : []),
    [dayKey, habits],
  );
  const totals = useMemo(() => last30Totals(habits, completions), [habits, completions]);
  const totalFreezes = Object.values(freezes).reduce((sum, list) => sum + list.length, 0);
  const avgPercent = totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: 40, paddingHorizontal: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.kicker}>Статистика</Text>
        <Text style={s.h1}>Твой год</Text>

        <View style={s.heatmapCard}>
          <Text style={s.cardTitle}>Тепловая карта</Text>
          <YearHeatmap
            habits={habits}
            completions={completions}
            onPickDay={(key) => {
              setDayKey(key);
              dayRef.current?.open();
            }}
          />
          <Text style={s.heatmapHint}>Нажми на день — увидишь все дела</Text>
        </View>

        <Text style={s.section}>Последние 30 дней</Text>
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>
              {totals.done}
              <Text style={s.statSub}>/{totals.total}</Text>
            </Text>
            <Text style={s.statLabel}>выполнено</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{avgPercent}%</Text>
            <Text style={s.statLabel}>средний результат</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{totalFreezes}</Text>
            <Text style={s.statLabel}>заморозок</Text>
          </View>
        </View>

        <Text style={s.section}>По привычкам</Text>
        {habits.map((h) => (
          <HabitStatCard
            key={h.id}
            habit={h}
            completions={completions}
            freezes={freezes}
            onPress={() => {
              setDetailId(h.id);
              detailRef.current?.open();
            }}
          />
        ))}
        {habits.length === 0 && (
          <View style={s.empty}>
            <Text style={s.emptyText}>Статистика появится, когда добавишь привычки</Text>
          </View>
        )}
      </ScrollView>

      <DaySheet
        sheetRef={dayRef}
        dateKey={dayKey}
        habits={dayHabits}
        completions={completions}
        freezes={freezes}
        onPick={(h) => {
          setDetailId(h.id);
          detailRef.current?.open();
        }}
      />
      <HabitDetailSheet sheetRef={detailRef} habit={detailHabit} dateKey={dayKey ?? todayKey} />
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
    heatmapCard: {
      backgroundColor: p.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: p.line,
      padding: 16,
      marginTop: 22,
    },
    cardTitle: {
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: p.muted,
      marginBottom: 12,
    },
    heatmapHint: {
      fontFamily: fonts.medium,
      fontSize: 11,
      color: p.muted,
      marginTop: 10,
      textAlign: 'center',
    },
    section: {
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: p.muted,
      marginTop: 24,
      marginBottom: 12,
    },
    statsRow: { flexDirection: 'row' },
    statCard: {
      flex: 1,
      backgroundColor: p.card,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: p.line,
      alignItems: 'center',
      paddingVertical: 16,
      marginRight: 10,
    },
    statValue: { fontFamily: fonts.displayBold, fontSize: 26, color: p.ink },
    statSub: { fontFamily: fonts.display, fontSize: 16, color: p.muted },
    statLabel: { fontFamily: fonts.medium, fontSize: 11, color: p.muted, marginTop: 4 },
    empty: {
      alignItems: 'center',
      backgroundColor: p.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: p.line,
      padding: 26,
    },
    emptyText: { fontFamily: fonts.medium, fontSize: 13, color: p.muted, textAlign: 'center' },
  });
