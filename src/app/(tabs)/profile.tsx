import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LevelCard } from '@/components/LevelCard';
import { useHabits } from '@/store/habits';
import { useSettings, type ThemeMode } from '@/store/settings';
import { monthStats, pluralDays, pluralHabits } from '@/lib/habits';
import { bestStreakOf } from '@/lib/stats';
import { levelProgress, totalXp } from '@/lib/xp';
import { hasPermission, reconcileNotifications, requestPermission } from '@/lib/notifications';
import { MONTHS_NOM } from '@/lib/date';
import { fonts, type Palette } from '@/theme/tokens';
import { usePalette, useThemedStyles } from '@/theme/useTheme';

const THEME_OPTIONS: { key: ThemeMode; label: string }[] = [
  { key: 'system', label: 'Как в системе' },
  { key: 'light', label: 'Светлая' },
  { key: 'dark', label: 'Тёмная' },
];

export default function ProfileScreen() {
  const p = usePalette();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const habits = useHabits((st) => st.habits);
  const completions = useHabits((st) => st.completions);
  const freezes = useHabits((st) => st.freezes);
  const resetAll = useHabits((st) => st.resetAll);
  const themeMode = useSettings((st) => st.themeMode);
  const setThemeMode = useSettings((st) => st.setThemeMode);

  const [notifGranted, setNotifGranted] = useState<boolean | null>(null);

  useEffect(() => {
    hasPermission().then(setNotifGranted);
  }, []);

  const now = new Date();
  const stats = monthStats(habits, completions, now.getFullYear(), now.getMonth());
  const bestStreak = habits.reduce((max, h) => Math.max(max, bestStreakOf(h, completions, freezes)), 0);
  const totalFreezes = Object.values(freezes).reduce((sum, list) => sum + list.length, 0);
  const xp = useMemo(() => totalXp(habits, completions), [habits, completions]);
  const progress = levelProgress(xp);

  const enableNotifications = async () => {
    const ok = await requestPermission();
    setNotifGranted(ok);
    if (!ok) {
      Alert.alert('Нет доступа', 'Разреши уведомления для «Дисциплины» в настройках телефона.');
    }
  };

  const confirmReset = () => {
    Alert.alert('Сбросить всё?', 'Все привычки и история выполнения будут удалены.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Сбросить',
        style: 'destructive',
        onPress: () => {
          resetAll();
          // расписание пушей чистим здесь же, иначе напоминания удалённых привычек
          // продолжат приходить
          void reconcileNotifications([]);
        },
      },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 22, paddingBottom: 40, paddingHorizontal: 22 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.kicker}>Профиль</Text>
        <Text style={s.h1}>Твой путь</Text>

        <View style={s.gridRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{habits.length}</Text>
            <Text style={s.statLabel}>{pluralHabits(habits.length)}</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{stats.done}</Text>
            <Text style={s.statLabel}>
              выполнено{'\n'}в {MONTHS_NOM[now.getMonth()].toLowerCase()}
            </Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{bestStreak}</Text>
            <Text style={s.statLabel}>{pluralDays(bestStreak)} лучшая серия</Text>
          </View>
        </View>

        <Text style={s.section}>Уровень</Text>
        <LevelCard progress={progress} />

        <Text style={s.section}>Тема</Text>
        <View style={s.themeRow}>
          {THEME_OPTIONS.map((opt) => {
            const active = opt.key === themeMode;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setThemeMode(opt.key)}
                style={[
                  s.themeChip,
                  {
                    backgroundColor: active ? p.accent : 'transparent',
                    borderColor: active ? p.accent : p.line,
                  },
                ]}
              >
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 13,
                    color: active ? p.onAccent : p.ink,
                  }}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={enableNotifications} style={s.notifRow}>
          <Feather name="bell" size={20} color={notifGranted ? p.success : p.muted} />
          <Text style={s.notifText}>
            Напоминания:{' '}
            {notifGranted === null ? 'проверяем…' : notifGranted ? 'разрешены' : 'выключены'}
          </Text>
          {notifGranted === false && <Text style={s.notifAction}>Включить</Text>}
        </Pressable>

        {totalFreezes > 0 && (
          <Text style={s.freezesNote}>
            Заморозок использовано: {totalFreezes} — серия под защитой
          </Text>
        )}

        <View style={s.quoteCard}>
          <Text style={s.quote}>
            «Дисциплина — это выбор между тем, чего ты хочешь сейчас, и тем, чего хочешь больше всего»
          </Text>
        </View>

        <Pressable onPress={confirmReset} style={s.resetBtn}>
          <Feather name="trash-2" size={16} color={p.danger} />
          <Text style={s.resetText}>Сбросить все данные</Text>
        </Pressable>

        <Text style={s.footer}>Дисциплина • v0.4 • данные хранятся только на устройстве</Text>
      </ScrollView>
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
    gridRow: { flexDirection: 'row', marginTop: 26 },
    statCard: {
      flex: 1,
      backgroundColor: p.card,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: p.line,
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: 6,
      marginRight: 10,
    },
    statValue: { fontFamily: fonts.displayBold, fontSize: 34, color: p.ink },
    statLabel: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: p.muted,
      marginTop: 6,
      textAlign: 'center',
    },
    section: {
      fontFamily: fonts.bold,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: p.muted,
      marginTop: 26,
      marginBottom: 10,
    },
    themeRow: { flexDirection: 'row', flexWrap: 'wrap' },
    themeChip: {
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 14,
      paddingVertical: 9,
      marginRight: 8,
      marginBottom: 8,
    },
    notifRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: p.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.line,
      padding: 16,
      marginTop: 14,
    },
    notifText: { fontFamily: fonts.medium, fontSize: 14, color: p.ink, marginLeft: 12, flex: 1 },
    notifAction: { fontFamily: fonts.semibold, fontSize: 14, color: p.accent },
    freezesNote: { fontFamily: fonts.medium, fontSize: 12, color: p.muted, marginTop: 10 },
    quoteCard: { backgroundColor: p.accentSoft, borderRadius: 20, padding: 22, marginTop: 14 },
    quote: {
      fontFamily: fonts.display,
      fontSize: 17,
      color: p.ink,
      lineHeight: 26,
    },
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: p.dangerSoft,
      paddingVertical: 13,
      marginTop: 28,
    },
    resetText: { fontFamily: fonts.semibold, fontSize: 14, color: p.danger, marginLeft: 8 },
    footer: {
      fontFamily: fonts.medium,
      fontSize: 12,
      color: p.muted,
      textAlign: 'center',
      marginTop: 24,
      marginBottom: 20,
    },
  });
