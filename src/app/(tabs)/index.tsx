import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DayRing } from '@/components/DayRing';
import { HabitCard } from '@/components/HabitCard';
import { HabitFormSheet } from '@/components/HabitFormSheet';
import { HabitDetailSheet } from '@/components/HabitDetailSheet';
import type { SheetHandle } from '@/components/Sheet';
import { useHabits } from '@/store/habits';
import { TIME_LABEL, TIME_ORDER, isDone, scheduledOn } from '@/lib/habits';
import { dayLong, toDateKey } from '@/lib/date';
import type { Habit } from '@/types/habit';
import { fonts, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

export default function TodayScreen() {
  const p = usePalette();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const habits = useHabits((st) => st.habits);
  const completions = useHabits((st) => st.completions);

  const formRef = useRef<SheetHandle | null>(null);
  const detailRef = useRef<SheetHandle | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Habit | null>(null);

  const selected = habits.find((h) => h.id === selectedId) ?? null;

  const today = new Date();
  const key = toDateKey(today);
  const list = scheduledOn(habits, today);
  const doneCount = list.filter((h) => isDone(completions, h, key)).length;

  const grouped = TIME_ORDER.map((t) => ({
    time: t,
    items: list.filter((h) => h.timeOfDay === t),
  })).filter((g) => g.items.length > 0);

  const openDetail = (h: Habit) => {
    setSelectedId(h.id);
    detailRef.current?.open();
  };

  const openCreate = () => {
    setEditing(null);
    formRef.current?.open();
  };

  const openEdit = (h: Habit) => {
    setEditing(h);
    formRef.current?.open();
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 22,
          paddingBottom: 140,
          paddingHorizontal: 22,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.kicker}>Сегодня</Text>
        <Text style={s.date}>{dayLong(today)}</Text>

        <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 30 }}>
          <DayRing done={doneCount} total={list.length} />
        </View>

        {grouped.map((g) => (
          <View key={g.time} style={{ marginBottom: 18 }}>
            <Text style={s.section}>{TIME_LABEL[g.time]}</Text>
            {g.items.map((h) => (
              <HabitCard
                key={h.id}
                habit={h}
                entry={completions[h.id]?.[key]}
                date={today}
                onOpen={() => openDetail(h)}
              />
            ))}
          </View>
        ))}

        {list.length === 0 && (
          <View style={s.empty}>
            <Feather name="sunrise" size={34} color={p.accent} />
            <Text style={s.emptyTitle}>Здесь будут твои привычки</Text>
            <Text style={s.emptyHint}>Нажми на «+», чтобы создать первую</Text>
          </View>
        )}
      </ScrollView>

      <Pressable onPress={openCreate} style={[s.fab, { bottom: insets.bottom + 24 }]}>
        <Feather name="plus" size={28} color={p.onAccent} />
      </Pressable>

      <HabitFormSheet sheetRef={formRef} editing={editing} />
      <HabitDetailSheet sheetRef={detailRef} habit={selected} dateKey={key} onEdit={openEdit} />
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
    date: { fontFamily: fonts.displayBold, fontSize: 30, color: p.ink, marginTop: 4 },
    section: {
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: p.muted,
      marginBottom: 10,
    },
    empty: {
      alignItems: 'center',
      backgroundColor: p.card,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: p.line,
      padding: 28,
    },
    emptyTitle: { fontFamily: fonts.display, fontSize: 21, color: p.ink, marginTop: 12 },
    emptyHint: { fontFamily: fonts.medium, fontSize: 13, color: p.muted, marginTop: 4 },
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
