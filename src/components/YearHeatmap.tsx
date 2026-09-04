import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Completions } from '@/lib/habits';
import { isDone, scheduledOn } from '@/lib/habits';
import { MONTHS_SHORT, mondayIndex, toDateKey } from '@/lib/date';
import type { Habit } from '@/types/habit';
import { fonts, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

const CELL = 13;
const GAP = 3;
const STEP = CELL + GAP;
const WEEKS = 53;

const levelColor = (done: number, total: number, p: Palette) => {
  if (total === 0) return p.heatEmpty;
  const r = done / total;
  if (r >= 1) return p.heatLevels[3];
  if (r >= 0.5) return p.heatLevels[2];
  if (r > 0) return p.heatLevels[1];
  return p.heatLevels[0];
};

type Props = {
  habits: Habit[];
  completions: Completions;
  onPickDay: (dateKey: string) => void;
};

export function YearHeatmap({ habits, completions, onPickDay }: Props) {
  const p = usePalette();
  const styles = useThemedStyles(makeStyles);
  const scrollRef = useRef<ScrollView>(null);

  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (WEEKS - 1) * 7);
    start.setDate(start.getDate() - mondayIndex(start));
    const cols: Date[][] = [];
    const cur = new Date(start);
    for (let w = 0; w < WEEKS; w++) {
      const week: Date[] = [];
      for (let i = 0; i < 7; i++) {
        week.push(new Date(cur));
        cur.setDate(cur.getDate() + 1);
      }
      cols.push(week);
    }
    return cols;
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);

  const monthLabels = useMemo(() => {
    const labels: (string | null)[] = [];
    let lastMonth = -1;
    weeks.forEach((w) => {
      const m = w[0].getMonth();
      if (m !== lastMonth) {
        labels.push(MONTHS_SHORT[m]);
        lastMonth = m;
      } else {
        labels.push(null);
      }
    });
    return labels;
  }, [weeks]);

  useEffect(() => {
    // прокручиваем карту к сегодняшнему дню
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });
  }, []);

  const contentWidth = WEEKS * STEP;
  const gridHeight = 7 * STEP;

  let yearDone = 0;
  let yearTotal = 0;

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 2 }}
    >
      <View style={{ width: contentWidth }}>
        <View style={styles.monthRow}>
          {monthLabels.map((label, i) => (
            <View key={i} style={{ width: STEP }}>
              {label ? <Text style={styles.monthLabel}>{label}</Text> : null}
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row' }}>
          {weeks.map((week, wi) => (
            <View key={wi} style={{ width: CELL, marginRight: GAP }}>
              {week.map((date) => {
                const key = toDateKey(date);
                const isFuture = key > todayKey;
                const list = isFuture ? [] : scheduledOn(habits, date);
                const done = list.filter((h) => isDone(completions, h, key)).length;
                yearTotal += list.length;
                yearDone += done;
                return (
                  <Pressable
                    key={key}
                    onPress={isFuture ? undefined : () => onPickDay(key)}
                    style={[
                      styles.cell,
                      { backgroundColor: isFuture ? 'transparent' : levelColor(done, list.length, p) },
                    ]}
                  />
                );
              })}
            </View>
          ))}
        </View>
        <View style={[styles.legend, { width: contentWidth, marginTop: 8 }]}>
          <Text style={styles.legendText}>меньше</Text>
          <View style={[styles.cell, { backgroundColor: p.heatEmpty }]} />
          {p.heatLevels.map((c) => (
            <View key={c} style={[styles.cell, { backgroundColor: c }]} />
          ))}
          <Text style={styles.legendText}>больше</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.legendTotal}>
            {yearDone} из {yearTotal}
          </Text>
        </View>
      </View>
      <View style={{ height: gridHeight }} />
    </ScrollView>
  );
}

const makeStyles = (p: Palette) =>
  StyleSheet.create({
    monthRow: { flexDirection: 'row', height: 16, marginBottom: 2 },
    monthLabel: { fontFamily: fonts.medium, fontSize: 9, color: p.muted },
    cell: { width: CELL, height: CELL, borderRadius: 3, marginBottom: GAP },
    legend: { flexDirection: 'row', alignItems: 'center' },
    legendText: { fontFamily: fonts.medium, fontSize: 10, color: p.muted, marginRight: 6 },
    legendTotal: { fontFamily: fonts.semibold, fontSize: 10, color: p.accentDeep },
  });
